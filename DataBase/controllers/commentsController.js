const pool = require('../db/pool');

// Fetch comments for a specific recipe
exports.getCommentsForRecipe = async (req, res) => {
    try {
        const recipeId = parseInt(req.params.id, 10);
        if (Number.isNaN(recipeId)) {
            return res.status(400).json({ error: 'Invalid recipe id' });
        }

        const [rows] = await pool.query(
            `SELECT c.id, c.comment_text, c.created_at, u.username AS author
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.recipe_id = ?
             ORDER BY c.created_at DESC`,
            [recipeId]
        );

        res.json(rows);
    } catch (err) {
        console.error('getCommentsForRecipe error:', err);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

// Add a comment to a recipe (requires auth)
exports.postComment = async (req, res) => {
    try {
        const recipeId = parseInt(req.params.id, 10);
        const userId = req.user ? req.user.id : null;
        const { comment_text } = req.body;

        if (Number.isNaN(recipeId)) {
            return res.status(400).json({ error: 'Invalid recipe id' });
        }

        if (!comment_text || comment_text.trim().length === 0) {
            return res.status(400).json({ error: 'Comment text is required' });
        }

        if (comment_text.length > 500) {
            return res.status(400).json({ error: 'Comment must be 500 characters or less' });
        }

        await pool.query(
            `INSERT INTO comments (recipe_id, user_id, comment_text) VALUES (?, ?, ?)`,
            [recipeId, userId, comment_text.trim()]
        );

        res.json({ message: 'Comment added successfully' });
    } catch (err) {
        console.error('postComment error:', err);
        res.status(500).json({ error: 'Failed to add comment' });
    }
};
