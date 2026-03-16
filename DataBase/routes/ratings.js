const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

router.post("/", async (req, res) => {

    const { recipeId, rating } = req.body;
    const userId = req.user.id;

    await pool.query(
        `INSERT INTO ratings(recipe_id,user_id,rating)
     VALUES($1,$2,$3)
     ON CONFLICT(recipe_id,user_id)
     DO UPDATE SET rating=$3`,
        [recipeId, userId, rating]
    );

    res.send("Rating submitted");
});

module.exports = router;