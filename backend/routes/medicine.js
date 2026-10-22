const express = require("express");
const router = express.Router();

const db = require("../db");
const authenticateToken = require("../middleware/auth");


/* =========================================================
   MEDICINE SEARCH
   GET /api/medicines/search
========================================================= */

router.get("/search", async (req, res) => {

    try {

        const medicine =
            String(req.query.medicine || "").trim();

        const city =
            String(req.query.city || "").trim();

        const area =
            String(req.query.area || "").trim();


        if (!medicine || !city) {

            return res.status(400).json({
                error: "Medicine and city are required"
            });

        }


        let sql = `
            SELECT
                m.id,
                m.name,
                m.category,
                m.quantity,
                m.price,
                m.city,
                m.area,

                p.id AS pharmacy_id,
                p.name AS pharmacy_name,
                p.owner_name,
                p.phone AS pharmacy_phone,
                p.address AS pharmacy_address,
                p.availability_status

            FROM medicines m

            INNER JOIN pharmacies p
                ON m.pharmacy_id = p.id

            WHERE m.name LIKE ?
              AND m.city LIKE ?
              AND m.quantity > 0
              AND p.availability_status = 'Available'
        `;


        const params = [
            `%${medicine}%`,
            `%${city}%`
        ];


        if (area) {

            sql += `
                AND m.area LIKE ?
            `;

            params.push(`%${area}%`);

        }


        sql += `
            ORDER BY m.created_at DESC
        `;


        const [rows] =
            await db.query(sql, params);


        res.json({
            results: rows
        });


    } catch (error) {

        console.error(
            "Medicine search error:",
            error
        );

        res.status(500).json({
            error:
                "Server error while searching medicines"
        });

    }

});


/* =========================================================
   MEDICINE REQUEST
   POST /api/medicines/request
========================================================= */

router.post(
    "/request",
    authenticateToken,
    async (req, res) => {

        try {

            const userId =
                req.user.id;


            const {
                medicine,
                city,
                area,
                quantity
            } = req.body;


            if (!medicine || !city) {

                return res.status(400).json({
                    error:
                        "Medicine and city are required"
                });

            }


            const [result] =
                await db.query(
                    `
                    INSERT INTO medicine_requests
                    (
                        user_id,
                        medicine_name,
                        city,
                        area,
                        quantity
                    )

                    VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        userId,
                        medicine,
                        city,
                        area || null,
                        Number(quantity) || 1
                    ]
                );


            res.status(201).json({

                message:
                    "Medicine request created",

                id:
                    result.insertId

            });


        } catch (error) {

            console.error(
                "Medicine request error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while creating medicine request"
            });

        }

    }
);


/* =========================================================
   USER MEDICINE REQUESTS
   GET /api/medicines/requests
========================================================= */

router.get(
    "/requests",
    authenticateToken,
    async (req, res) => {

        try {

            const [rows] =
                await db.query(
                    `
                    SELECT *
                    FROM medicine_requests

                    WHERE user_id = ?

                    ORDER BY created_at DESC
                    `,
                    [
                        req.user.id
                    ]
                );


            res.json({
                requests: rows
            });


        } catch (error) {

            console.error(
                "Medicine requests error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while loading medicine requests"
            });

        }

    }
);


module.exports = router;