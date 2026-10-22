const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/auth");

router.get("/search", async (req, res) => {
    try {
        const name = String(req.query.name || "").trim();
        const city = String(req.query.city || "").trim();
        let sql = `SELECT id,user_id,name,address,city,phone,email,beds,available_beds,availability_status,created_at FROM hospitals WHERE 1=1`;
        const params = [];
        if (name) { sql += " AND name LIKE ?"; params.push(`%${name}%`); }
        if (city) { sql += " AND city LIKE ?"; params.push(`%${city}%`); }
        sql += " ORDER BY created_at DESC";
        const [rows] = await db.query(sql, params);
        res.json({ results: rows });
    } catch (err) { console.error("Hospital search error:", err); res.status(500).json({ error: "Server error while searching hospitals" }); }
});

router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM hospitals WHERE user_id = ?", [req.user.id]);
        if (!rows.length) return res.json({ hospital: null });
        const hospital = rows[0]; hospital.available = hospital.availability_status === "Available";
        res.json({ hospital });
    } catch (err) { console.error("Get hospital profile error:", err); res.status(500).json({ error: "Server error" }); }
});

router.post("/profile", authenticateToken, async (req, res) => {
    try {
        const { name, address, city, phone, email, beds, available_beds, availability } = req.body;
        if (!name) return res.status(400).json({ error: "Hospital name is required" });
        const status = availability === false ? "Unavailable" : "Available";
        await db.query(`UPDATE users SET name = ?, email = COALESCE(?, email), phone = ?, city = ? WHERE id = ?`, [name, email || null, phone || null, city || null, req.user.id]);
        const [existing] = await db.query("SELECT id FROM hospitals WHERE user_id = ?", [req.user.id]);
        if (existing.length) {
            await db.query(`UPDATE hospitals SET name=?,address=?,city=?,phone=?,email=?,beds=?,available_beds=?,availability_status=? WHERE user_id=?`, [name,address || null,city || null,phone || null,email || null,Number(beds)||0,Number(available_beds)||0,status,req.user.id]);
        } else {
            await db.query(`INSERT INTO hospitals (user_id,name,address,city,phone,email,beds,available_beds,availability_status) VALUES (?,?,?,?,?,?,?,?,?)`, [req.user.id,name,address || null,city || null,phone || null,email || null,Number(beds)||0,Number(available_beds)||0,status]);
        }
        const [rows] = await db.query("SELECT * FROM hospitals WHERE user_id = ?", [req.user.id]);
        const hospital = rows[0]; hospital.available = hospital.availability_status === "Available";
        res.json({ message: "Hospital profile saved", hospital });
    } catch (err) { console.error("Hospital profile save error:", err); res.status(500).json({ error: "Failed to save hospital profile" }); }
});

router.get("/:id", async (req, res) => {
    try { const [rows] = await db.query("SELECT * FROM hospitals WHERE id = ?", [req.params.id]); if (!rows.length) return res.status(404).json({ error: "Hospital not found" }); res.json({ hospital: rows[0] }); }
    catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});


module.exports = router;
