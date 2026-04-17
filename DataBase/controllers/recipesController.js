const pool = require('../db/pool');

// Create a new recipe
exports.createRecipe = async (req, res) => {
    try {
        const { title, description, estimated_time, ingredients, instructions } = req.body;

        if (!title || title.trim().length === 0 || title.length > 25) {
            return res.status(400).json({ error: 'Title is required and must be 1-25 characters' });
        }

        if (!description || description.trim().length === 0 || description.length > 800) {
            return res.status(400).json({ error: 'Description must be 1-800 characters' });
        }

        if (!ingredients || !Array.isArray(ingredients)) {
            return res.status(400).json({ error: 'Ingredients must be an array' });
        }

        if (!instructions || instructions.trim().length === 0) {
            return res.status(400).json({ error: 'Instructions are required' });
        }

        const user_id = req.user ? req.user.id : null;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const sql = `
            INSERT INTO recipes (user_id, title, description, estimated_time, image_url, ingredients, instructions)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await pool.query(sql, [
            user_id,
            title.trim(),
            description.trim(),
            estimated_time || null,
            image_url,
            JSON.stringify(ingredients),
            instructions.trim()
        ]);

        res.json({ message: 'Recipe created successfully' });

    } catch (err) {
        console.error('createRecipe error:', err);
        res.status(500).json({ error: 'Failed to create recipe' });
    }
};

// Get all recipes
exports.getRecipes = async (req, res) => {
    try {
        const timeFilter = typeof req.query.time_filter === 'string' ? req.query.time_filter.trim() : '';
        const ratingFilter = typeof req.query.rating_filter === 'string' ? req.query.rating_filter.trim() : '';
        const commentFilter = typeof req.query.comment_filter === 'string' ? req.query.comment_filter.trim() : '';

        const whereConditions = [];
        const havingConditions = [];
        const params = [];

        const timeInMinutesExpr = `
            CASE
                WHEN r.estimated_time IS NULL OR TRIM(r.estimated_time) = '' THEN NULL
                WHEN LOWER(r.estimated_time) REGEXP 'hour|hr' THEN CAST(r.estimated_time AS DECIMAL(10,2)) * 60
                ELSE CAST(r.estimated_time AS DECIMAL(10,2))
            END
        `;

        if (timeFilter) {
            if (timeFilter.endsWith('+')) {
                const min = parseInt(timeFilter, 10);
                if (!isNaN(min)) {
                    havingConditions.push(`${timeInMinutesExpr} >= ?`);
                    params.push(min);
                }
            } else {
                const [min, max] = timeFilter.split('-').map(Number);
                if (!isNaN(min) && !isNaN(max)) {
                    havingConditions.push(`${timeInMinutesExpr} BETWEEN ? AND ?`);
                    params.push(min, max);
                }
            }
        }

        if (ratingFilter) {
            const [min, max] = ratingFilter.split('-').map(Number);
            if (!isNaN(min) && !isNaN(max)) {
                havingConditions.push('COALESCE(AVG(rt.rating), 0) BETWEEN ? AND ?');
                params.push(min, max);
            }
        }

        if (commentFilter === 'has_comments') {
            havingConditions.push('COUNT(c.id) > 0');
        } else if (commentFilter === 'no_comments') {
            havingConditions.push('COUNT(c.id) = 0');
        }

        const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const havingClause = havingConditions.length ? `HAVING ${havingConditions.join(' AND ')}` : '';

        const [rows] = await pool.query(`
            SELECT
                r.id,
                r.title,
                r.description,
                r.ingredients,
                r.instructions,
                r.estimated_time,
                r.image_url,
                r.created_at,
                r.updated_at,
                u.id AS author_id,
                u.username AS author,
                COALESCE(AVG(rt.rating), 0) AS average_rating,
                COUNT(DISTINCT c.id) AS comment_count
            FROM recipes r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN ratings rt ON rt.recipe_id = r.id
            LEFT JOIN comments c ON c.recipe_id = r.id
            ${whereClause}
            GROUP BY r.id
            ${havingClause}
            ORDER BY r.created_at DESC
        `, params);

        rows.forEach(r => {
            try {
                r.ingredients = r.ingredients ? JSON.parse(r.ingredients) : [];
            } catch {
                r.ingredients = [];
            }
        });

        res.json(rows);

    } catch (err) {
        console.error('getRecipes error:', err);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
};

// Get recipe by ID
exports.getRecipeById = async (req, res) => {
    try {
        const recipeId = parseInt(req.params.id, 10);
        if (isNaN(recipeId)) {
            return res.status(400).json({ error: 'Invalid recipe id' });
        }

        const [rows] = await pool.query(`
            SELECT
                r.id,
                r.title,
                r.description,
                r.ingredients,
                r.instructions,
                r.estimated_time,
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
            return res.status(404).json({ error: 'Recipe not found' });
        }

        const recipe = rows[0];

        try {
            recipe.ingredients = recipe.ingredients ? JSON.parse(recipe.ingredients) : [];
        } catch {
            recipe.ingredients = [];
        }

        res.json(recipe);

    } catch (err) {
        console.error('getRecipeById error:', err);
        res.status(500).json({ error: 'Failed to fetch recipe' });
    }
};

// Update recipe
exports.updateRecipe = async (req, res) => {
    try {
        const { title, description, estimated_time, ingredients, instructions } = req.body;
        const recipeId = parseInt(req.params.id, 10);

        if (isNaN(recipeId)) {
            return res.status(400).json({ error: 'Invalid recipe id' });
        }

        if (!title || title.trim().length === 0 || title.length > 25) {
            return res.status(400).json({ error: 'Title must be 1-25 characters' });
        }

        if (!description || description.trim().length === 0 || description.length > 800) {
            return res.status(400).json({ error: 'Description must be 1-800 characters' });
        }

        if (!ingredients || !Array.isArray(ingredients)) {
            return res.status(400).json({ error: 'Ingredients must be an array' });
        }

        if (!instructions || instructions.trim().length === 0) {
            return res.status(400).json({ error: 'Instructions are required' });
        }

        const image_url = req.file ? `/uploads/${req.file.filename}` : undefined;

        let sql = `
            UPDATE recipes
            SET title = ?, description = ?, estimated_time = ?, ingredients = ?, instructions = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        let params = [
            title.trim(),
            description.trim(),
            estimated_time || null,
            JSON.stringify(ingredients),
            instructions.trim(),
            recipeId
        ];

        if (image_url !== undefined) {
            sql = `
                UPDATE recipes
                SET title = ?, description = ?, estimated_time = ?, image_url = ?, ingredients = ?, instructions = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            params = [
                title.trim(),
                description.trim(),
                estimated_time || null,
                image_url,
                JSON.stringify(ingredients),
                instructions.trim(),
                recipeId
            ];
        }

        const [result] = await pool.query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        res.json({ message: 'Recipe updated successfully' });

    } catch (err) {
        console.error('updateRecipe error:', err);
        res.status(500).json({ error: 'Failed to update recipe' });
    }
};

// Get current user's recipes
exports.getMyRecipes = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [rows] = await pool.query(`
            SELECT
                r.id,
                r.user_id,
                r.title,
                r.description,
                r.ingredients,
                r.instructions,
                r.estimated_time,
                r.image_url,
                r.created_at,
                r.updated_at
            FROM recipes r
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        `, [user_id]);

        rows.forEach(r => {
            try {
                r.ingredients = r.ingredients ? JSON.parse(r.ingredients) : [];
            } catch {
                r.ingredients = [];
            }
        });

        res.json(rows);

    } catch (err) {
        console.error('getMyRecipes error:', err);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
};

// Get following feed
exports.getFollowingFeed = async (req, res) => {
    try {
        const userId = req.user.id;

        const [rows] = await pool.query(`
            SELECT
                r.id,
                r.title,
                r.description,
                r.ingredients,
                r.instructions,
                r.estimated_time,
                r.image_url,
                r.created_at,
                r.updated_at,
                u.username AS author
            FROM recipes r
            JOIN user_follows f ON r.user_id = f.following_id
            JOIN users u ON r.user_id = u.id
            WHERE f.follower_id = ?
            ORDER BY r.created_at DESC
        `, [userId]);

        rows.forEach(r => {
            try {
                r.ingredients = r.ingredients ? JSON.parse(r.ingredients) : [];
            } catch {
                r.ingredients = [];
            }
        });

        res.json(rows);

    } catch (err) {
        console.error('getFollowingFeed error:', err);
        res.status(500).json({ error: 'Failed to fetch following feed' });
    }
};
