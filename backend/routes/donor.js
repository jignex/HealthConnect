const express = require("express");
const router = express.Router();

const db = require("../db");
const authenticateToken = require("../middleware/auth");


/* =========================================================
   GET DONOR PROFILE
========================================================= */

router.get("/profile", authenticateToken, async (req, res) => {

    try {

        const userId = req.user.id;

        const [rows] = await db.query(
            `SELECT
                d.id,
                d.user_id,
                u.name,
                u.email,
                d.blood_group,
                d.age,
                d.gender,
                d.phone,
                d.city,
                d.address,
                d.last_donation_date,
                d.availability_status
             FROM donors d
             JOIN users u
                ON d.user_id = u.id
             WHERE d.user_id = ?`,
            [userId]
        );

        if (rows.length === 0) {

            return res.status(404).json({
                error: "Donor profile not found"
            });

        }

        const donor = rows[0];

        donor.available =
            donor.availability_status === "Available";

        res.json({
            donor
        });

    } catch (error) {

        console.error(
            "Get donor profile error:",
            error
        );

        res.status(500).json({
            error: "Failed to get donor profile"
        });

    }

});


/* =========================================================
   REGISTER / UPDATE DONOR
========================================================= */

router.post("/register", authenticateToken, async (req, res) => {

    try {

        const userId = req.user.id;

        const {
            name,
            blood_group,
            age,
            gender,
            phone,
            city,
            address,
            availability
        } = req.body;


        if (!blood_group || !city) {

            return res.status(400).json({
                error: "Blood group and city are required"
            });

        }


        await db.query(
            `UPDATE users
             SET
                name = ?,
                phone = ?,
                city = ?
             WHERE id = ?`,
            [
                name || "",
                phone || "",
                city || "",
                userId
            ]
        );


        const availabilityStatus =
            availability === false
                ? "Unavailable"
                : "Available";


        const [existing] = await db.query(
            `SELECT id
             FROM donors
             WHERE user_id = ?`,
            [userId]
        );


        if (existing.length > 0) {

            await db.query(
                `UPDATE donors
                 SET
                    blood_group = ?,
                    age = ?,
                    gender = ?,
                    phone = ?,
                    city = ?,
                    address = ?,
                    availability_status = ?
                 WHERE user_id = ?`,
                [
                    blood_group,
                    age || null,
                    gender || null,
                    phone || null,
                    city,
                    address || null,
                    availabilityStatus,
                    userId
                ]
            );

        } else {

            await db.query(
                `INSERT INTO donors
                (
                    user_id,
                    blood_group,
                    age,
                    gender,
                    phone,
                    city,
                    address,
                    availability_status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    blood_group,
                    age || null,
                    gender || null,
                    phone || null,
                    city,
                    address || null,
                    availabilityStatus
                ]
            );

        }


        const [rows] = await db.query(
            `SELECT
                d.id,
                d.user_id,
                u.name,
                u.email,
                d.blood_group,
                d.age,
                d.gender,
                d.phone,
                d.city,
                d.address,
                d.last_donation_date,
                d.availability_status
             FROM donors d
             JOIN users u
                ON d.user_id = u.id
             WHERE d.user_id = ?`,
            [userId]
        );


        const donor = rows[0];

        donor.available =
            donor.availability_status === "Available";


        res.status(201).json({

            message:
                "Donor registered successfully",

            donor

        });


    } catch (error) {

        console.error(
            "Donor registration error:",
            error
        );

        res.status(500).json({
            error: "Failed to register donor"
        });

    }

});


/* =========================================================
   UPDATE DONOR PROFILE
   Creates the donor record if it does not exist.
========================================================= */

router.put("/profile", authenticateToken, async (req, res) => {

    try {

        const userId = req.user.id;

        const {
            name,
            email,
            blood_group,
            age,
            gender,
            phone,
            city,
            address,
            availability
        } = req.body;


        if (!name || !email || !blood_group || !city) {

            return res.status(400).json({
                error:
                    "Name, email, blood group and city are required"
            });

        }


        /* -------------------------------------------------
           Update the main users table
        ------------------------------------------------- */

        await db.query(
            `UPDATE users
             SET
                name = ?,
                email = ?,
                phone = ?,
                city = ?
             WHERE id = ?`,
            [
                name,
                email,
                phone || "",
                city,
                userId
            ]
        );


        /* -------------------------------------------------
           Convert frontend availability to database value
        ------------------------------------------------- */

        const availabilityStatus =
            availability === false
                ? "Unavailable"
                : "Available";


        /* -------------------------------------------------
           Check whether donor profile exists
        ------------------------------------------------- */

        const [existing] = await db.query(
            `SELECT id
             FROM donors
             WHERE user_id = ?`,
            [userId]
        );


        /* -------------------------------------------------
           Update existing donor
        ------------------------------------------------- */

        if (existing.length > 0) {

            await db.query(
                `UPDATE donors
                 SET
                    blood_group = ?,
                    age = ?,
                    gender = ?,
                    phone = ?,
                    city = ?,
                    address = ?,
                    availability_status = ?
                 WHERE user_id = ?`,
                [
                    blood_group,
                    age || null,
                    gender || null,
                    phone || "",
                    city,
                    address || "",
                    availabilityStatus,
                    userId
                ]
            );

        }


        /* -------------------------------------------------
           Create donor profile if it does not exist
        ------------------------------------------------- */

        else {

            await db.query(
                `INSERT INTO donors
                (
                    user_id,
                    blood_group,
                    age,
                    gender,
                    phone,
                    city,
                    address,
                    availability_status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    blood_group,
                    age || null,
                    gender || null,
                    phone || "",
                    city,
                    address || "",
                    availabilityStatus
                ]
            );

        }


        /* -------------------------------------------------
           Return the newly saved donor profile
        ------------------------------------------------- */

        const [rows] = await db.query(
            `SELECT
                d.id,
                d.user_id,
                u.name,
                u.email,
                d.blood_group,
                d.age,
                d.gender,
                d.phone,
                d.city,
                d.address,
                d.last_donation_date,
                d.availability_status
             FROM donors d
             JOIN users u
                ON d.user_id = u.id
             WHERE d.user_id = ?`,
            [userId]
        );


        if (rows.length === 0) {

            return res.status(404).json({
                error: "Unable to create donor profile"
            });

        }


        const donor = rows[0];

        donor.available =
            donor.availability_status === "Available";


        res.json({

            message:
                "Donor profile updated successfully",

            donor

        });


    } catch (error) {

        console.error(
            "Donor profile update error:",
            error
        );

        res.status(500).json({
            error: "Failed to update donor profile"
        });

    }

});


/* =========================================================
   UPDATE DONOR AVAILABILITY
========================================================= */

router.put("/availability", authenticateToken, async (req, res) => {

    try {

        const userId = req.user.id;

        const {
            available
        } = req.body;


        const availabilityStatus =
            available === false
                ? "Unavailable"
                : "Available";


        const [result] = await db.query(
            `UPDATE donors
             SET availability_status = ?
             WHERE user_id = ?`,
            [
                availabilityStatus,
                userId
            ]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                error:
                    "Donor profile not found"
            });

        }


        res.json({

            message:
                "Donor availability updated successfully",

            available:
                availabilityStatus === "Available"

        });


    } catch (error) {

        console.error(
            "Donor availability error:",
            error
        );

        res.status(500).json({
            error:
                "Failed to update donor availability"
        });

    }

});


module.exports = router;
