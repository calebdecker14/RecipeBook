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

        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const sql = `
            INSERT INTO recipes (user_id, title, description, estimated_time, image_url)
            VALUES (?, ?, ?, ?, ?)
        `;

        await pool.query(sql, [user_id, title.trim(), description.trim(), estimated_time || null, image_url]);

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
                r.image_url,
                r.created_at,
                r.updated_at,
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
                r.image_url,
                r.created_at,
                r.updated_at,
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

        const image_url = req.file ? `/uploads/${req.file.filename}` : undefined;

        let sql = `
            UPDATE recipes
            SET title = ?, description = ?, estimated_time = ?
            WHERE id = ?
        `;
        let params = [
            title.trim(),
            description.trim(),
            estimated_time || null,
            recipeId
        ];

        if (image_url !== undefined) {
            sql = `
                UPDATE recipes
                SET title = ?, description = ?, estimated_time = ?, image_url = ?
                WHERE id = ?
            `;
            params = [
                title.trim(),
                description.trim(),
                estimated_time || null,
                image_url,
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

// Return recipes for the current user
exports.getMyRecipes = async (req, res) => {
    try {
        const user_id = req.user.id;
        const timeFilter = typeof req.query.time_filter === 'string' ? req.query.time_filter.trim() : '';
        const ratingFilter = typeof req.query.rating_filter === 'string' ? req.query.rating_filter.trim() : '';
        const commentFilter = typeof req.query.comment_filter === 'string' ? req.query.comment_filter.trim() : '';

        const whereConditions = ['r.user_id = ?'];
        const havingConditions = [];
        const params = [user_id];

        const timeInMinutesExpr = `
            CASE
                WHEN r.estimated_time IS NULL OR TRIM(r.estimated_time) = '' THEN NULL
                WHEN LOWER(r.estimated_time) REGEXP 'hour|hr' THEN CAST(r.estimated_time AS DECIMAL(10,2)) * 60
                ELSE CAST(r.estimated_time AS DECIMAL(10,2))
            END
        `;

        if (timeFilter) {
            if (timeFilter.endsWith('+')) {
                const min = Number.parseInt(timeFilter, 10);
                if (!Number.isNaN(min)) {
                    havingConditions.push(`${timeInMinutesExpr} >= ?`);
                    params.push(min);
                }
            } else {
                const [minStr, maxStr] = timeFilter.split('-');
                const min = Number.parseInt(minStr, 10);
                const max = Number.parseInt(maxStr, 10);
                if (!Number.isNaN(min) && !Number.isNaN(max)) {
                    havingConditions.push(`${timeInMinutesExpr} BETWEEN ? AND ?`);
                    params.push(min, max);
                }
            }
        }

        if (ratingFilter) {
            const [minRatingStr, maxRatingStr] = ratingFilter.split('-');
            const minRating = Number.parseFloat(minRatingStr);
            const maxRating = Number.parseFloat(maxRatingStr);
            if (!Number.isNaN(minRating) && !Number.isNaN(maxRating)) {
                havingConditions.push('COALESCE(AVG(rt.rating), 0) BETWEEN ? AND ?');
                params.push(minRating, maxRating);
            }
        }

        if (commentFilter === 'has_comments') {
            havingConditions.push('COUNT(c.id) > 0');
        } else if (commentFilter === 'no_comments') {
            havingConditions.push('COUNT(c.id) = 0');
        }

        const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
        const havingClause = havingConditions.length ? `HAVING ${havingConditions.join(' AND ')}` : '';

        const [rows] = await pool.query(`
            SELECT
                r.id,
                r.user_id,
                r.title,
                r.description,
                r.estimated_time,
                r.image_url,
                r.created_at,
                r.updated_at,
                u.username AS author,
                COALESCE(AVG(rt.rating), 0) AS average_rating,
                COUNT(c.id) AS comment_count
            FROM recipes r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN ratings rt ON rt.recipe_id = r.id
            LEFT JOIN comments c ON c.recipe_id = r.id
            ${whereClause}
            GROUP BY r.id
            ${havingClause}
            ORDER BY r.created_at DESC
        `, params);

        res.json(rows);
    } catch (err) {
        console.error('getMyRecipes error:', err);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
};
