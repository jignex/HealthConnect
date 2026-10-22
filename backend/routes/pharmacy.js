const express = require("express");
const router = express.Router();

const db = require("../db");
const authenticateToken = require("../middleware/auth");


/* =========================================================
   GET PHARMACY PROFILE
   GET /api/pharmacy/profile
========================================================= */

router.get(
    "/profile",
    authenticateToken,
    async (req, res) => {

        try {

            const [rows] = await db.query(
                `
                SELECT
                    id,
                    user_id,
                    name,
                    owner_name,
                    email,
                    phone,
                    city,
                    address,
                    availability_status

                FROM pharmacies

                WHERE user_id = ?
                `,
                [req.user.id]
            );


            if (rows.length === 0) {

                return res.json({
                    profile: null
                });

            }


            res.json({
                profile: rows[0]
            });


        } catch (error) {

            console.error(
                "Pharmacy profile error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while loading pharmacy profile"
            });

        }

    }
);


/* =========================================================
   CREATE / UPDATE PHARMACY PROFILE
   POST /api/pharmacy/profile
========================================================= */

router.post(
    "/profile",
    authenticateToken,
    async (req, res) => {

        try {

            const {
                name,
                owner_name,
                email,
                phone,
                city,
                address,
                availability
            } = req.body;


            if (!name || !city) {

                return res.status(400).json({
                    error:
                        "Pharmacy name and city are required"
                });

            }


            const availabilityStatus =
                availability === false
                    ? "Unavailable"
                    : "Available";


            const [existing] =
                await db.query(
                    `
                    SELECT id
                    FROM pharmacies
                    WHERE user_id = ?
                    `,
                    [req.user.id]
                );


            if (existing.length > 0) {

                await db.query(
                    `
                    UPDATE pharmacies

                    SET
                        name = ?,
                        owner_name = ?,
                        email = ?,
                        phone = ?,
                        city = ?,
                        address = ?,
                        availability_status = ?

                    WHERE user_id = ?
                    `,
                    [
                        name,
                        owner_name || null,
                        email || null,
                        phone || null,
                        city,
                        address || null,
                        availabilityStatus,
                        req.user.id
                    ]
                );


                return res.json({
                    message:
                        "Pharmacy profile updated"
                });

            }


            const [result] =
                await db.query(
                    `
                    INSERT INTO pharmacies
                    (
                        user_id,
                        name,
                        owner_name,
                        email,
                        phone,
                        city,
                        address,
                        availability_status
                    )

                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        req.user.id,
                        name,
                        owner_name || null,
                        email || null,
                        phone || null,
                        city,
                        address || null,
                        availabilityStatus
                    ]
                );


            res.status(201).json({

                message:
                    "Pharmacy profile created",

                id:
                    result.insertId

            });


        } catch (error) {

            console.error(
                "Pharmacy profile save error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while saving pharmacy profile"
            });

        }

    }
);


/* =========================================================
   GET PHARMACY MEDICINES
   GET /api/pharmacy/medicines
========================================================= */

router.get(
    "/medicines",
    authenticateToken,
    async (req, res) => {

        try {

            const [rows] =
                await db.query(
                    `
                    SELECT
                        id,
                        name,
                        category,
                        quantity,
                        price,
                        city,
                        area,
                        created_at

                    FROM medicines

                    WHERE pharmacy_id = (
                        SELECT id
                        FROM pharmacies
                        WHERE user_id = ?
                    )

                    ORDER BY created_at DESC
                    `,
                    [
                        req.user.id
                    ]
                );


            res.json({
                medicines: rows
            });


        } catch (error) {

            console.error(
                "Pharmacy medicines error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while loading medicines"
            });

        }

    }
);


/* =========================================================
   ADD MEDICINE
   POST /api/pharmacy/medicines
========================================================= */

router.post(
    "/medicines",
    authenticateToken,
    async (req, res) => {

        try {

            const {
                name,
                category,
                quantity,
                price,
                city,
                area
            } = req.body;


            if (!name || !city) {

                return res.status(400).json({
                    error:
                        "Medicine name and city are required"
                });

            }


            const [pharmacy] =
                await db.query(
                    `
                    SELECT id
                    FROM pharmacies
                    WHERE user_id = ?
                    `,
                    [
                        req.user.id
                    ]
                );


            if (pharmacy.length === 0) {

                return res.status(404).json({
                    error:
                        "Pharmacy profile not found"
                });

            }


            const [result] =
                await db.query(
                    `
                    INSERT INTO medicines
                    (
                        pharmacy_id,
                        name,
                        category,
                        quantity,
                        price,
                        city,
                        area
                    )

                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        pharmacy[0].id,
                        name,
                        category || null,
                        Number(quantity) || 0,
                        Number(price) || 0,
                        city,
                        area || null
                    ]
                );


            res.status(201).json({

                message:
                    "Medicine added successfully",

                id:
                    result.insertId

            });


        } catch (error) {

            console.error(
                "Add medicine error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while adding medicine"
            });

        }

    }
);


/* =========================================================
   UPDATE MEDICINE
   PUT /api/pharmacy/medicines/:id
========================================================= */

router.put(
    "/medicines/:id",
    authenticateToken,
    async (req, res) => {

        try {

            const medicineId =
                Number(req.params.id);


            const {
                name,
                category,
                quantity,
                price,
                city,
                area
            } = req.body;


            if (!medicineId) {

                return res.status(400).json({
                    error:
                        "Invalid medicine ID"
                });

            }


            const [result] =
                await db.query(
                    `
                    UPDATE medicines

                    SET
                        name = ?,
                        category = ?,
                        quantity = ?,
                        price = ?,
                        city = ?,
                        area = ?

                    WHERE id = ?

                      AND pharmacy_id = (
                          SELECT id
                          FROM pharmacies
                          WHERE user_id = ?
                      )
                    `,
                    [
                        name,
                        category || null,
                        Number(quantity) || 0,
                        Number(price) || 0,
                        city,
                        area || null,
                        medicineId,
                        req.user.id
                    ]
                );


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        "Medicine not found"
                });

            }


            res.json({
                message:
                    "Medicine updated successfully"
            });


        } catch (error) {

            console.error(
                "Update medicine error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while updating medicine"
            });

        }

    }
);


/* =========================================================
   DELETE MEDICINE
   DELETE /api/pharmacy/medicines/:id
========================================================= */

router.delete(
    "/medicines/:id",
    authenticateToken,
    async (req, res) => {

        try {

            const medicineId =
                Number(req.params.id);


            if (!medicineId) {

                return res.status(400).json({
                    error:
                        "Invalid medicine ID"
                });

            }


            const [result] =
                await db.query(
                    `
                    DELETE FROM medicines

                    WHERE id = ?

                      AND pharmacy_id = (
                          SELECT id
                          FROM pharmacies
                          WHERE user_id = ?
                      )
                    `,
                    [
                        medicineId,
                        req.user.id
                    ]
                );


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        "Medicine not found"
                });

            }


            res.json({
                message:
                    "Medicine deleted successfully"
            });


        } catch (error) {

            console.error(
                "Delete medicine error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while deleting medicine"
            });

        }

    }
);


module.exports = router;