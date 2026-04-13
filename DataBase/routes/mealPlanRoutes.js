const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// GET /mealplan/my - get all meal plan entries for the logged-in user
router.get("/my", async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        const [rows] = await pool.query(
            "SELECT date, recipe_id AS recipeId FROM meal_plans WHERE user_id = ?",
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error("GET /mealplan/my error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// POST /mealplan - save a meal plan entry
router.post("/", async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        const { date, recipeId } = req.body;
        if (!date || !recipeId) return res.status(400).json({ error: "date and recipeId are required" });
        await pool.query(
            "INSERT IGNORE INTO meal_plans (user_id, date, recipe_id) VALUES (?, ?, ?)",
            [userId, date, recipeId]
        );
        res.json({ message: "Meal plan saved" });
    } catch (err) {
        console.error("POST /mealplan error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// DELETE /mealplan - remove a meal plan entry
router.delete("/", async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        const { date, recipeId } = req.body;
        if (!date || !recipeId) return res.status(400).json({ error: "date and recipeId are required" });
        await pool.query(
            "DELETE FROM meal_plans WHERE user_id = ? AND date = ? AND recipe_id = ?",
            [userId, date, recipeId]
        );
        res.json({ message: "Meal plan entry deleted" });
    } catch (err) {
        console.error("DELETE /mealplan error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
