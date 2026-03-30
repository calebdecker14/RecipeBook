const express = require("express");
const router = express.Router();
const pool = require("../db/pool");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/", authenticateToken, async (req, res) => {

    try {
        const recipeId = Number.parseInt(req.body.recipeId, 10);
        const rating = Number.parseInt(req.body.rating, 10);
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (Number.isNaN(recipeId)) {
            return res.status(400).json({ error: "Invalid recipeId" });
        }

        if (Number.isNaN(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Rating must be an integer between 1 and 5" });
        }

        await pool.query(
            `INSERT INTO ratings (recipe_id, user_id, rating)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
            [recipeId, userId, rating]
        );

        const [avgRows] = await pool.query(
            `SELECT COALESCE(AVG(rating), 0) AS average_rating
             FROM ratings
             WHERE recipe_id = ?`,
            [recipeId]
        );

        res.json({
            message: "Rating submitted",
            recipeId,
            average_rating: Number.parseFloat(avgRows[0].average_rating || 0)
        });
    } catch (err) {
        console.error("ratings route error:", err);
        res.status(500).json({ error: "Failed to submit rating" });
    }

});

module.exports = router;