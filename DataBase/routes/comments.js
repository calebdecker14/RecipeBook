const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// Get comments
router.get("/:recipeId", async (req, res) => {
    const result = await pool.query(
        "SELECT * FROM comments WHERE recipe_id=$1",
        [req.params.recipeId]
    );
    res.json(result.rows);
});

// Post comment
router.post("/", async (req, res) => {

    const { recipeId, comment } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
        "INSERT INTO comments(recipe_id,user_id,comment) VALUES($1,$2,$3)",
        [recipeId, userId, comment]
    );

    res.send("Comment added");
});

module.exports = router;