const express = require("express");
const router = express.Router();
const pool = require("../db/pool");
const { authenticateToken } = require("../middleware/authMiddleware");

// ---------------------- SAVE MEAL ----------------------
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { recipeId, date } = req.body;
    const userId = req.user.id;

    const [result] = await pool.query(
      "INSERT INTO meal_plans (user_id, recipe_id, date) VALUES (?, ?, ?)",
      [userId, recipeId, date]
    );

    res.json({
      id: result.insertId,
      recipeId,
      date
    });
  } catch (err) {
    console.error("Error saving meal:", err);
    res.status(500).json({ error: "Failed to save meal" });
  }
});

// ---------------------- LOAD MEALS FOR USER ----------------------
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
          mp.id, 
          mp.date, 
          r.id AS recipeId, 
          r.title, 
          r.image_url AS imageUrl
       FROM meal_plans mp
       JOIN recipes r ON mp.recipe_id = r.id
       WHERE mp.user_id = ?`,
      [userId]
    );

    res.json(rows);  // returns a clean array
  } catch (err) {
    console.error("Error loading meals:", err);
    res.status(500).json({ error: "Failed to load meal plan" });
  }
});

// ---------------------- DELETE MEAL ----------------------
router.delete("/", authenticateToken, async (req, res) => {
  try {
    const { date, recipeId } = req.body;
    const userId = req.user.id;

    await pool.query(
      "DELETE FROM meal_plans WHERE user_id = ? AND recipe_id = ? AND date = ?",
      [userId, recipeId, date]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting meal:", err);
    res.status(500).json({ error: "Failed to delete meal" });
  }
});

module.exports = router;
