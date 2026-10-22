const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/auth");

router.get("/search", async (req, res) => {
    try {
        const specialization = String(req.query.specialization || "").trim();
        const city = String(req.query.city || "").trim();
        let sql = `SELECT id,user_id,name,specialization,qualification,experience,email,phone,city,availability_status,created_at FROM doctors WHERE 1=1`;
        const params = [];
        if (specialization) { sql += " AND specialization LIKE ?"; params.push(`%${specialization}%`); }
        if (city) { sql += " AND city LIKE ?"; params.push(`%${city}%`); }
        sql += " ORDER BY created_at DESC";
        const [rows] = await db.query(sql, params);
        res.json({ results: rows.map(row => ({ ...row, available: row.availability_status === "Available" })) });
    } catch (err) { console.error("Doctor search error:", err); res.status(500).json({ error: "Server error while searching doctors" }); }
});

// Doctor account profile
router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM doctors WHERE user_id = ?", [req.user.id]);
        if (!rows.length) return res.json({ doctor: null });
        const doctor = rows[0];
        doctor.available = doctor.availability_status === "Available";
        res.json({ doctor });
    } catch (err) { console.error("Get doctor profile error:", err); res.status(500).json({ error: "Server error" }); }
});

router.post("/profile", authenticateToken, async (req, res) => {
    try {
        const { name, specialization, qualification, experience, email, phone, city, availability } = req.body;
        if (!name) return res.status(400).json({ error: "Doctor name is required" });
        const status = availability === false ? "Unavailable" : "Available";
        await db.query(`UPDATE users SET name = ?, email = COALESCE(?, email), phone = ?, city = ? WHERE id = ?`, [name, email || null, phone || null, city || null, req.user.id]);
        const [existing] = await db.query("SELECT id FROM doctors WHERE user_id = ?", [req.user.id]);
        if (existing.length) {
            await db.query(`UPDATE doctors SET name=?, specialization=?, qualification=?, experience=?, email=?, phone=?, city=?, availability_status=? WHERE user_id=?`, [name, specialization || null, qualification || null, experience || null, email || null, phone || null, city || null, status, req.user.id]);
        } else {
            await db.query(`INSERT INTO doctors (user_id,name,specialization,qualification,experience,email,phone,city,availability_status) VALUES (?,?,?,?,?,?,?,?,?)`, [req.user.id,name,specialization || null,qualification || null,experience || null,email || null,phone || null,city || null,status]);
        }
        const [rows] = await db.query("SELECT * FROM doctors WHERE user_id = ?", [req.user.id]);
        const doctor = rows[0]; doctor.available = doctor.availability_status === "Available";
        res.json({ message: "Doctor profile saved", doctor });
    } catch (err) { console.error("Doctor profile save error:", err); res.status(500).json({ error: "Failed to save doctor profile" }); }
});

router.get("/:id", async (req, res) => {
    try { const [rows] = await db.query("SELECT * FROM doctors WHERE id = ?", [req.params.id]); if (!rows.length) return res.status(404).json({ error: "Doctor not found" }); res.json({ doctor: rows[0] }); }
    catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

router.post("/appointment", authenticateToken, async (req, res) => {
    try {
        const { doctorId, appointmentDate, appointmentTime, reason } = req.body;
        if (!doctorId || !appointmentDate) return res.status(400).json({ error: "doctorId and appointmentDate are required" });
        const [result] = await db.query(`INSERT INTO appointments (user_id,doctor_id,appointment_date,appointment_time,reason) VALUES (?,?,?,?,?)`, [req.user.id, doctorId, appointmentDate, appointmentTime || null, reason || null]);
        res.status(201).json({ message: "Appointment request created", id: result.insertId });
    } catch (err) { console.error("Appointment error:", err); res.status(500).json({ error: "Server error" }); }
});

router.get("/appointments/list", authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT a.*, d.name AS doctor_name, d.specialization FROM appointments a INNER JOIN doctors d ON a.doctor_id=d.id WHERE a.user_id=? ORDER BY a.appointment_date DESC,a.appointment_time DESC`, [req.user.id]);
        res.json({ appointments: rows });
    } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

module.exports = router;
