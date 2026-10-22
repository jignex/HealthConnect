const express = require("express");
const router = express.Router();

const db = require("../db");
const authenticateToken = require("../middleware/auth");


/* =========================================================
   GET USER NOTIFICATIONS
   GET /api/notifications
========================================================= */

router.get(
    "/",
    authenticateToken,
    async (req, res) => {

        try {

            const [rows] =
                await db.query(
                    `
                    SELECT
                        id,
                        title,
                        message,
                        type,
                        is_read,
                        created_at

                    FROM notifications

                    WHERE user_id = ?

                    ORDER BY created_at DESC
                    `,
                    [
                        req.user.id
                    ]
                );


            res.json({
                notifications: rows
            });


        } catch (error) {

            console.error(
                "Notifications loading error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while loading notifications"
            });

        }

    }
);


/* =========================================================
   MARK SINGLE NOTIFICATION AS READ
   PATCH /api/notifications/:id/read
========================================================= */

router.patch(
    "/:id/read",
    authenticateToken,
    async (req, res) => {

        try {

            const notificationId =
                Number(req.params.id);


            if (!notificationId) {

                return res.status(400).json({
                    error:
                        "Invalid notification ID"
                });

            }


            const [result] =
                await db.query(
                    `
                    UPDATE notifications

                    SET is_read = 1

                    WHERE id = ?
                      AND user_id = ?
                    `,
                    [
                        notificationId,
                        req.user.id
                    ]
                );


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        "Notification not found"
                });

            }


            res.json({
                message:
                    "Notification marked as read"
            });


        } catch (error) {

            console.error(
                "Mark notification error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while updating notification"
            });

        }

    }
);


/* =========================================================
   MARK ALL NOTIFICATIONS AS READ
   PATCH /api/notifications/read-all
========================================================= */

router.patch(
    "/read-all",
    authenticateToken,
    async (req, res) => {

        try {

            await db.query(
                `
                UPDATE notifications

                SET is_read = 1

                WHERE user_id = ?
                  AND is_read = 0
                `,
                [
                    req.user.id
                ]
            );


            res.json({
                message:
                    "All notifications marked as read"
            });


        } catch (error) {

            console.error(
                "Read all notifications error:",
                error
            );

            res.status(500).json({
                error:
                    "Server error while updating notifications"
            });

        }

    }
);


module.exports = router;