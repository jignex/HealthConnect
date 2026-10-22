const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/auth");

router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, name, email, phone, city, blood_group, address, role
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (!rows.length) {
            return res.status(404).json({ error: "User profile not found" });
        }

        res.json({ user: rows[0] });
    } catch (error) {
        console.error("Get user profile error:", error);
        res.status(500).json({ error: "Failed to get user profile" });
    }
});

router.put("/profile", authenticateToken, async (req, res) => {
    try {
        const { name, email, phone, city, blood_group, address } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: "Name and email are required" });
        }

        await db.query(
            `UPDATE users
             SET name = ?, email = ?, phone = ?, city = ?, blood_group = ?, address = ?
             WHERE id = ?`,
            [
                name.trim(),
                email.trim(),
                phone || null,
                city || null,
                blood_group || null,
                address || null,
                req.user.id
            ]
        );

        const [rows] = await db.query(
            `SELECT id, name, email, phone, city, blood_group, address, role
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        res.json({ message: "User profile saved", user: rows[0] });
    } catch (error) {
        console.error("Update user profile error:", error);
        res.status(500).json({ error: "Failed to save user profile" });
    }
});

module.exports = router;
