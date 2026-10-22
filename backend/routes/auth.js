
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
require('dotenv').config();

const router = express.Router();

const VALID_ROLES = [
    'user', 'donor', 'pharmacy', 'oxygen', 'doctor', 'hospital'
];

// Temporary OTP storage. OTPs expire after 5 minutes.
// For a production deployment, use a database or shared cache instead.
const pendingOtps = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashOtp(otp) {
    return crypto.createHash('sha256').update(otp).digest('hex');
}

function maskEmail(email) {
    const [name, domain] = email.split('@');
    if (!domain) return 'your email';
    return `${name.slice(0, 1)}***@${domain}`;
}

function createToken(user) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is missing from backend/.env');
    }

    return jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// =====================================================
// REGISTER — existing registration behavior
// =====================================================

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, city, role } = req.body;
        const selectedRole = role || 'user';
        const cleanEmail = String(email || '').trim().toLowerCase();

        if (!VALID_ROLES.includes(selectedRole)) {
            return res.status(400).json({ error: 'Invalid account type' });
        }

        if (!name || !cleanEmail || !password) {
            return res.status(400).json({
                error: 'Name, email and password are required'
            });
        }

        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [cleanEmail]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                error: 'Email already registered'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO users
             (name, email, password_hash, phone, city, role)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                name.trim(),
                cleanEmail,
                passwordHash,
                phone || null,
                city || null,
                selectedRole
            ]
        );

        return res.status(201).json({
            message: 'Registered successfully',
            user: {
                id: result.insertId,
                name: name.trim(),
                email: cleanEmail,
                role: selectedRole
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// =====================================================
// LOGIN — check credentials, then email OTP
// =====================================================

router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const cleanEmail = String(email || '').trim().toLowerCase();

        if (!cleanEmail || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        if (!role || !VALID_ROLES.includes(role)) {
            return res.status(400).json({
                error: 'Select a valid account type'
            });
        }

        if (!process.env.BREVO_API_KEY || !process.env.EMAIL_FROM) {
            console.error('BREVO_API_KEY or EMAIL_FROM is missing');
            return res.status(500).json({
                error: 'Email service is not configured. Contact the administrator.'
            });
        }

        const [rows] = await db.query(
            `SELECT id, name, email, password_hash, phone, city, role
             FROM users WHERE email = ?`,
            [cleanEmail]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        const user = rows[0];
        const validPassword = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        if (user.role !== role) {
            return res.status(403).json({
                error: `This account is registered as ${user.role}, not ${role}.`
            });
        }

        const previous = pendingOtps.get(cleanEmail);

        if (previous && Date.now() - previous.createdAt < RESEND_WAIT_MS) {
            return res.status(429).json({
                error: 'Please wait 60 seconds before requesting another OTP.'
            });
        }

        const otp = String(crypto.randomInt(100000, 1000000));

        pendingOtps.set(cleanEmail, {
            otpHash: hashOtp(otp),
            userId: user.id,
            role: user.role,
            attempts: 0,
            expiresAt: Date.now() + OTP_EXPIRY_MS,
            createdAt: Date.now()
        });

        const emailPayload = {
            sender: {
                name: 'HealthConnect',
                email: process.env.EMAIL_FROM
            },
            to: [{ email: cleanEmail, name: user.name }],
            subject: 'Your HealthConnect login OTP',
            textContent:
                `Hello ${user.name}, your HealthConnect login OTP is ${otp}. ` +
                'It expires in 5 minutes. Do not share this code with anyone.',
            htmlContent:
                `<p>Hello ${user.name},</p>` +
                `<p>Your HealthConnect login OTP is:</p>` +
                `<h2 style="letter-spacing:5px">${otp}</h2>` +
                `<p>This code expires in 5 minutes. Do not share it with anyone.</p>`
        };

        const emailResponse = await fetch(
            'https://api.brevo.com/v3/smtp/email',
            {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify(emailPayload)
            }
        );

        if (!emailResponse.ok) {
            const details = await emailResponse.text();
            console.error('Brevo email error:', emailResponse.status, details);
            pendingOtps.delete(cleanEmail);

            return res.status(502).json({
                error: 'Could not send OTP email. Check the verified sender and Brevo account.'
            });
        }

        return res.json({
            otpRequired: true,
            message: `OTP sent to ${maskEmail(cleanEmail)}. Check your inbox and spam folder.`,
            email: cleanEmail
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// =====================================================
// VERIFY OTP — only now issue JWT
// =====================================================

router.post('/verify-otp', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const otp = String(req.body.otp || '').trim();

        if (!email || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                error: 'Enter the email and the 6-digit OTP.'
            });
        }

        const pending = pendingOtps.get(email);

        if (!pending) {
            return res.status(400).json({
                error: 'No active OTP found. Log in again to request a new one.'
            });
        }

        if (Date.now() > pending.expiresAt) {
            pendingOtps.delete(email);
            return res.status(400).json({
                error: 'OTP expired. Log in again to request a new one.'
            });
        }

        if (pending.attempts >= MAX_ATTEMPTS) {
            pendingOtps.delete(email);
            return res.status(429).json({
                error: 'Too many incorrect attempts. Log in again to request a new OTP.'
            });
        }

        if (hashOtp(otp) !== pending.otpHash) {
            pending.attempts += 1;

            if (pending.attempts >= MAX_ATTEMPTS) {
                pendingOtps.delete(email);
            }

            return res.status(401).json({
                error: 'Incorrect OTP. Please try again.'
            });
        }

        const [rows] = await db.query(
            `SELECT id, name, email, phone, city, role
             FROM users WHERE id = ? AND email = ?`,
            [pending.userId, email]
        );

        pendingOtps.delete(email);

        if (!rows.length || rows[0].role !== pending.role) {
            return res.status(401).json({
                error: 'Account could not be verified. Please log in again.'
            });
        }

        const user = rows[0];
        const token = createToken(user);

        return res.json({
            message: 'Email verified. Login successful.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                city: user.city,
                role: user.role
            }
        });
    } catch (err) {
        console.error('OTP verification error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
