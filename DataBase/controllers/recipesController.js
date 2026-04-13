const pool = require('../db/pool');

// Create a new recipe entry in the database
exports.createRecipe = async (req, res) => {
    try {
        const {
            title,
            description,
            estimated_time,
            ingredients,
            instructions
        } = req.body;

        // Validation
        if (!title || title.trim().length === 0 || title.length > 25) {
            return res.status(400).json({
                error: 'Title is required and must be 1-25 characters'
            });
        }

        if (
            !description ||
            description.trim().length === 0 ||
            description.length > 800
        ) {
            return res.status(400).json({
                error: 'Description is required and must be 1-800 characters'
            });
        }

        const user_id = req.user ? req.user.id : null;
        const image_url = req.file
            ? `/uploads/${req.file.filename}`
            : null;

        const sql = `
            INSERT INTO recipes (
                user_id,
                title,
                description,
                estimated_time,
                ingredients,
                instructions,
                image_url
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await pool.query(sql, [
            user_id,
            title.trim(),
            description.trim(),
            estimated_time || null,
            JSON.stringify(ingredients || []),
            JSON.stringify(instructions || []),
            image_url
        ]);

        res.json({ message: 'Recipe created successfully' });

    } catch (err) {
        console.error('createRecipe error:', err);
        res.status(500).json({
            error: 'Failed to create recipe'
        });
    }
};

// Return all recipes
exports.getRecipes = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                r.id,
                r.title,
                r.description,
                r.estimated_time,
                r.ingredients,
                r.instructions,
                r.image_url,
                r.created_at,
                r.updated_at,
                u.username AS author,
                COALESCE(AVG(rt.rating), 0) AS average_rating,
                COUNT(DISTINCT c.id) AS comment_count
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
        res.status(500).json({
            error: 'Failed to fetch recipes'
        });
    }
};

// Return a single recipe by ID
exports.getRecipeById = async (req, res) => {
    try {
        const recipeId = parseInt(req.params.id, 10);

        if (Number.isNaN(recipeId)) {
            return res.status(400).json({
                error: 'Invalid recipe id'
            });
        }

        const [rows] = await pool.query(`
            SELECT
                r.id,
                r.title,
                r.description,
                r.estimated_time,
                r.ingredients,
                r.instructions,
                r.image_url,
                r.created_at,
                r.updated_at,
                u.username AS author,
                COALESCE(AVG(rt.rating), 0) AS average_rating,
                COUNT(DISTINCT c.id) AS comment_count
            FROM recipes r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN ratings rt ON rt.recipe_id = r.id
            LEFT JOIN comments c ON c.recipe_id = r.id
            WHERE r.id = ?
            GROUP BY r.id
        `, [recipeId]);

        if (!rows.length) {
            return res.status(404).json({
                error: 'Recipe not found'
            });
        }

        res.json(rows[0]);

    } catch (err) {
        console.error('getRecipeById error:', err);
        res.status(500).json({
            error: 'Failed to fetch recipe'
        });
    }
};

// Update recipe
exports.updateRecipe = async (req, res) => {
    try {
        const {
            title,
            description,
            estimated_time,
            ingredients,
            instructions
        } = req.body;

        const recipeId = parseInt(req.params.id, 10);

        if (Number.isNaN(recipeId)) {
            return res.status(400).json({
                error: 'Invalid recipe id'
            });
        }

        if (!title || title.trim().length === 0 || title.length > 25) {
            return res.status(400).json({
                error: 'Title must be 1-25 characters'
            });
        }

        if (
            !description ||
            description.trim().length === 0 ||
            description.length > 800
        ) {
            return res.status(400).json({
                error: 'Description must be 1-800 characters'
            });
        }

        const image_url = req.file
            ? `/uploads/${req.file.filename}`
            : undefined;

        let sql = `
            UPDATE recipes
            SET title = ?,
                description = ?,
                estimated_time = ?,
                ingredients = ?,
                instructions = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        let params = [
            title.trim(),
            description.trim(),
            estimated_time || null,
            JSON.stringify(ingredients || []),
            JSON.stringify(instructions || []),
            recipeId
        ];

        if (image_url !== undefined) {
            sql = `
                UPDATE recipes
                SET title = ?,
                    description = ?,
                    estimated_time = ?,
                    ingredients = ?,
                    instructions = ?,
                    image_url = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            params = [
                title.trim(),
                description.trim(),
                estimated_time || null,
                JSON.stringify(ingredients || []),
                JSON.stringify(instructions || []),
                image_url,
                recipeId
            ];
        }

        const [result] = await pool.query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Recipe not found'
            });
        }

        res.json({
            message: 'Recipe updated successfully'
        });

    } catch (err) {
        console.error('updateRecipe error:', err);
        res.status(500).json({
            error: 'Failed to update recipe'
        });
    }
};

// Return recipes for current user
exports.getMyRecipes = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [rows] = await pool.query(`
            SELECT
                r.id,
                r.user_id,
                r.title,
                r.description,
                r.estimated_time,
                r.ingredients,
                r.instructions,
                r.image_url,
                r.created_at,
                r.updated_at,
                u.username AS author,
                COALESCE(AVG(rt.rating), 0) AS average_rating,
                COUNT(DISTINCT c.id) AS comment_count
            FROM recipes r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN ratings rt ON rt.recipe_id = r.id
            LEFT JOIN comments c ON c.recipe_id = r.id
            WHERE r.user_id = ?
            GROUP BY r.id
            ORDER BY r.created_at DESC
        `, [user_id]);

        res.json(rows);

    } catch (err) {
        console.error('getMyRecipes error:', err);
        res.status(500).json({
            error: 'Failed to fetch recipes'
        });
    }
};