const express = require("express");
const router = express.Router();

const db = require("../db");
const authenticateToken = require("../middleware/auth");


/* =========================================================
   OXYGEN SEARCH
   GET /api/oxygen/search?type=Oxygen%20Cylinder&city=Mumbai
========================================================= */

router.get("/search", async (req, res) => {

    try {

        const type = String(req.query.type || "").trim();
        const city = String(req.query.city || "").trim();


        if (!type || !city) {

            return res.status(400).json({
                error: "type and city are required"
            });

        }


        const [rows] = await db.query(
            `
            SELECT
                oi.id,
                oi.type,
                oi.capacity,
                oi.quantity,
                oi.price,
                oi.city,

                op.id AS provider_id,
                op.name AS provider_name,
                op.owner_name,
                op.phone AS provider_phone,
                op.address AS provider_address,
                op.availability_status

            FROM oxygen_inventory oi

            INNER JOIN oxygen_providers op
                ON oi.provider_id = op.id

            WHERE oi.type = ?
              AND oi.city LIKE ?
              AND oi.quantity > 0
              AND op.availability_status = 'Available'

            ORDER BY oi.created_at DESC
            `,
            [
                type,
                `%${city}%`
            ]
        );


        const results = rows.map(row => ({

            id: row.id,

            type: row.type,

            capacity: row.capacity,

            quantity: row.quantity,

            price: row.price,

            city: row.city,

            provider_name: row.provider_name,

            provider_phone: row.provider_phone,

            provider_address: row.provider_address

        }));


        res.json({
            results
        });


    } catch (error) {

        console.error(
            "Oxygen search error:",
            error
        );

        res.status(500).json({
            error:
                "Server error while searching oxygen"
        });

    }

});


/* =========================================================
   OXYGEN REQUEST
   POST /api/oxygen/request
========================================================= */

router.post(
    "/request",
    authenticateToken,
    async (req, res) => {

        try {

            const {
                oxygenType,
                capacity,
                city,
                quantity
            } = req.body;


            const userId =
                req.user.id;


            if (!oxygenType || !city) {

                return res.status(400).json({
                    error:
                        "oxygenType and city are required"
                });

            }


            const [result] =
                await db.query(
                    `
                    INSERT INTO oxygen_requests
                    (
                        user_id,
                        oxygen_type,
                        capacity,
                        city,
                        quantity
                    )

                    VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        userId,
                        oxygenType,
                        capacity || null,
                        city,
                        Number(quantity) || 1
                    ]
                );


            res.status(201).json({

                message:
                    "Oxygen request created",

                id:
                    result.insertId

            });


        } catch (error) {

            console.error(
                "Oxygen request error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while creating oxygen request"
            });

        }

    }
);


/* =========================================================
   USER OXYGEN REQUESTS
   GET /api/oxygen/requests
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
                    FROM oxygen_requests

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
                "Oxygen requests error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while loading oxygen requests"
            });

        }

    }
);


module.exports = router;