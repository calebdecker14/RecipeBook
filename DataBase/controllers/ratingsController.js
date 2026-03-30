const pool = require('../db/pool');

// Fetch ratings for a specific recipe (includes average and count)
exports.getRatingsForRecipe = async (req, res) => {
    try {
        const recipeId = parseInt(req.params.id, 10);
        if (Number.isNaN(recipeId)) {
            return res.status(400).json({ error: 'Invalid recipe id' });
        }

        const [agg] = await pool.query(
            `SELECT
                COALESCE(AVG(rating), 0) AS average_rating,
                COUNT(*) AS count
             FROM ratings
             WHERE recipe_id = ?`,
            [recipeId]
        );

        const [rows] = await pool.query(
            `SELECT r.id, r.rating, r.created_at, u.username AS author
             FROM ratings r
             LEFT JOIN users u ON r.user_id = u.id
             WHERE r.recipe_id = ?
             ORDER BY r.created_at DESC`,
            [recipeId]
        );

        res.json({ summary: agg[0], ratings: rows });
    } catch (err) {
        console.error('getRatingsForRecipe error:', err);
        res.status(500).json({ error: 'Failed to fetch ratings' });
    }
};

// Add or update a rating for a recipe (requires auth)
exports.postRating = async (req, res) => {
    try {
        const recipeId = parseInt(req.params.id, 10);
        const userId = req.user ? req.user.id : null;
        const rating = parseInt(req.body.rating, 10);

        if (Number.isNaN(recipeId)) {
            return res.status(400).json({ error: 'Invalid recipe id' });
        }
        if (Number.isNaN(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
        }

        // Use INSERT ... ON DUPLICATE KEY UPDATE to allow users to change their rating
        await pool.query(
            `INSERT INTO ratings (recipe_id, user_id, rating)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
            [recipeId, userId, rating]
        );

        res.json({ message: 'Rating saved successfully' });
    } catch (err) {
        console.error('postRating error:', err);
        res.status(500).json({ error: 'Failed to save rating' });
    }
};
