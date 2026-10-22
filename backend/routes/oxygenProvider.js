const express = require("express");
const router = express.Router();

const db = require("../db");
const authenticateToken = require("../middleware/auth");


/* =========================================================
   GET OXYGEN PROVIDER PROFILE
   GET /api/oxygen-provider/profile
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

                FROM oxygen_providers

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
                "Oxygen provider profile error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while loading oxygen provider profile"
            });

        }

    }
);


/* =========================================================
   CREATE / UPDATE OXYGEN PROVIDER PROFILE
   POST /api/oxygen-provider/profile
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
                        "Provider name and city are required"
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
                    FROM oxygen_providers
                    WHERE user_id = ?
                    `,
                    [req.user.id]
                );


            if (existing.length > 0) {

                await db.query(
                    `
                    UPDATE oxygen_providers

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
                        "Oxygen provider profile updated"
                });

            }


            const [result] =
                await db.query(
                    `
                    INSERT INTO oxygen_providers
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
                    "Oxygen provider profile created",

                id:
                    result.insertId

            });


        } catch (error) {

            console.error(
                "Oxygen provider profile save error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while saving oxygen provider profile"
            });

        }

    }
);


/* =========================================================
   GET OXYGEN INVENTORY
   GET /api/oxygen-provider/inventory
========================================================= */

router.get(
    "/inventory",
    authenticateToken,
    async (req, res) => {

        try {

            const [rows] =
                await db.query(
                    `
                    SELECT
                        id,
                        type,
                        capacity,
                        quantity,
                        price,
                        city,
                        created_at

                    FROM oxygen_inventory

                    WHERE provider_id = (
                        SELECT id
                        FROM oxygen_providers
                        WHERE user_id = ?
                    )

                    ORDER BY created_at DESC
                    `,
                    [
                        req.user.id
                    ]
                );


            res.json({
                inventory: rows
            });


        } catch (error) {

            console.error(
                "Oxygen inventory error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while loading oxygen inventory"
            });

        }

    }
);


/* =========================================================
   ADD OXYGEN INVENTORY
   POST /api/oxygen-provider/inventory
========================================================= */

router.post(
    "/inventory",
    authenticateToken,
    async (req, res) => {

        try {

            const {
                type,
                capacity,
                quantity,
                price,
                city
            } = req.body;


            if (!type || !city) {

                return res.status(400).json({
                    error:
                        "Oxygen type and city are required"
                });

            }


            const [provider] =
                await db.query(
                    `
                    SELECT id
                    FROM oxygen_providers
                    WHERE user_id = ?
                    `,
                    [
                        req.user.id
                    ]
                );


            if (provider.length === 0) {

                return res.status(404).json({
                    error:
                        "Oxygen provider profile not found"
                });

            }


            const [result] =
                await db.query(
                    `
                    INSERT INTO oxygen_inventory
                    (
                        provider_id,
                        type,
                        capacity,
                        quantity,
                        price,
                        city
                    )

                    VALUES (?, ?, ?, ?, ?, ?)
                    `,
                    [
                        provider[0].id,
                        type,
                        capacity || null,
                        Number(quantity) || 0,
                        Number(price) || 0,
                        city
                    ]
                );


            res.status(201).json({

                message:
                    "Oxygen inventory added successfully",

                id:
                    result.insertId

            });


        } catch (error) {

            console.error(
                "Add oxygen inventory error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while adding oxygen inventory"
            });

        }

    }
);


/* =========================================================
   UPDATE OXYGEN INVENTORY
   PUT /api/oxygen-provider/inventory/:id
========================================================= */

router.put(
    "/inventory/:id",
    authenticateToken,
    async (req, res) => {

        try {

            const inventoryId =
                Number(req.params.id);


            const {
                type,
                capacity,
                quantity,
                price,
                city
            } = req.body;


            if (!inventoryId) {

                return res.status(400).json({
                    error:
                        "Invalid inventory ID"
                });

            }


            const [result] =
                await db.query(
                    `
                    UPDATE oxygen_inventory

                    SET
                        type = ?,
                        capacity = ?,
                        quantity = ?,
                        price = ?,
                        city = ?

                    WHERE id = ?

                      AND provider_id = (
                          SELECT id
                          FROM oxygen_providers
                          WHERE user_id = ?
                      )
                    `,
                    [
                        type,
                        capacity || null,
                        Number(quantity) || 0,
                        Number(price) || 0,
                        city,
                        inventoryId,
                        req.user.id
                    ]
                );


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        "Oxygen inventory not found"
                });

            }


            res.json({
                message:
                    "Oxygen inventory updated successfully"
            });


        } catch (error) {

            console.error(
                "Update oxygen inventory error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while updating oxygen inventory"
            });

        }

    }
);


/* =========================================================
   DELETE OXYGEN INVENTORY
   DELETE /api/oxygen-provider/inventory/:id
========================================================= */

router.delete(
    "/inventory/:id",
    authenticateToken,
    async (req, res) => {

        try {

            const inventoryId =
                Number(req.params.id);


            if (!inventoryId) {

                return res.status(400).json({
                    error:
                        "Invalid inventory ID"
                });

            }


            const [result] =
                await db.query(
                    `
                    DELETE FROM oxygen_inventory

                    WHERE id = ?

                      AND provider_id = (
                          SELECT id
                          FROM oxygen_providers
                          WHERE user_id = ?
                      )
                    `,
                    [
                        inventoryId,
                        req.user.id
                    ]
                );


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        "Oxygen inventory not found"
                });

            }


            res.json({
                message:
                    "Oxygen inventory deleted successfully"
            });


        } catch (error) {

            console.error(
                "Delete oxygen inventory error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while deleting oxygen inventory"
            });

        }

    }
);


module.exports = router;