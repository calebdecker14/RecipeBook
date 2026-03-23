const pool = require('../db/pool');

// Create a new recipe entry in the database
// Expects title, description, estimated_time (optional) and requires auth
exports.createRecipe = async (req, res) => {
    try {
        const { title, description, estimated_time } = req.body;

        // --- validation ---
        if (!title || title.trim().length === 0 || title.length > 25) {
            return res.status(400).json({ error: 'Title is required and must be 1-25 characters' });
        }
        if (!description || description.trim().length === 0 || description.length > 150) {
            return res.status(400).json({ error: 'Description is required and must be 1-150 characters' });
        }

        const user_id = req.user ? req.user.id : null;

        const sql = `
            INSERT INTO recipes (user_id, title, description, estimated_time)
            VALUES (?, ?, ?, ?)
        `;

        await pool.query(sql, [user_id, title.trim(), description.trim(), estimated_time || null]);

        res.json({ message: 'Recipe created successfully' });
    } catch (err) {
        console.error('createRecipe error:', err);
        res.status(500).json({ error: 'Failed to create recipe' });
    }
};

// Return all recipes (most recent first) including author name, average rating, comment count
exports.getRecipes = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                r.id,
                r.title,
                r.description,
                r.estimated_time,
                r.created_at,
                u.username AS author,
                COALESCE(AVG(rt.rating), 0) AS average_rating,
                COUNT(c.id) AS comment_count
            FROM recipes r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN ratings rt ON rt.recipe_id = r.id
            LEFT JOIN comments c ON c.recipe_id = r.id
            GROUP BY r.id
            ORDER BY r.created_at DESC
        `);

        res.json(rows);
    } catch (err) {
        console.error('getRecipes error:', err);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
};

// Return a single recipe by ID (useful for recipe detail pages)
exports.getRecipeById = async (req, res) => {
    try {
        const recipeId = parseInt(req.params.id, 10);
        if (Number.isNaN(recipeId)) {
            return res.status(400).json({ error: 'Invalid recipe id' });
        }

        const [rows] = await pool.query(`
            SELECT
                r.id,
                r.title,
                r.description,
                r.estimated_time,
                r.created_at,
                u.username AS author,
                COALESCE(AVG(rt.rating), 0) AS average_rating,
                COUNT(c.id) AS comment_count
            FROM recipes r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN ratings rt ON rt.recipe_id = r.id
            LEFT JOIN comments c ON c.recipe_id = r.id
            WHERE r.id = ?
            GROUP BY r.id
        `, [recipeId]);

        if (!rows.length) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('getRecipeById error:', err);
        res.status(500).json({ error: 'Failed to fetch recipe' });
    }
};

// Update an existing recipe
exports.updateRecipe = async (req, res) => {
    try {
        const { title, description, estimated_time } = req.body;
        const recipeId = parseInt(req.params.id, 10);

        if (Number.isNaN(recipeId)) {
            return res.status(400).json({ error: 'Invalid recipe id' });
        }

        if (!title || title.trim().length === 0 || title.length > 25) {
            return res.status(400).json({ error: 'Title must be 1-25 characters' });
        }

        if (!description || description.trim().length === 0 || description.length > 150) {
            return res.status(400).json({ error: 'Description must be 1-150 characters' });
        }

        const sql = `
            UPDATE recipes
            SET title = ?, description = ?, estimated_time = ?
            WHERE id = ?
        `;

        const [result] = await pool.query(sql, [
            title.trim(),
            description.trim(),
            estimated_time || null,
            recipeId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        res.json({ message: 'Recipe updated successfully' });

    } catch (err) {
        console.error('updateRecipe error:', err);
        res.status(500).json({ error: 'Failed to update recipe' });
    }
};
