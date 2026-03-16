require('dotenv').config();   // <--- REQUIRED

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());              // <--- REQUIRED for frontend to talk to backend
app.use(express.json());

// Import DB pool
const pool = require('./DataBase/db/pool');

// Root route
app.get('/', (req, res) => {
    res.send("Server is running!");
});

// Debug: check JWT secret
console.log("JWT_SECRET:", process.env.JWT_SECRET);

// Database test route
app.get('/db-test', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 + 1 AS result");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database connection failed" });
    }
});

// Auth routes
const authRoutes = require('./DataBase/routes/auth');
app.use('/auth', authRoutes);

// Recipes routes
const recipesRoutes = require('./DataBase/routes/recipes');
app.use('/recipes', recipesRoutes);

// Automatically create required tables if they don't exist.
// This is useful for simple student projects or early development.
(async () => {
    try {
        // recipes table: stores published recipes
        await pool.query(`
            CREATE TABLE IF NOT EXISTS recipes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                title VARCHAR(25) NOT NULL,
                description VARCHAR(150) NOT NULL,
                estimated_time VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // comments table: users can comment on recipes
        await pool.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                recipe_id INT NOT NULL,
                user_id INT,
                comment_text VARCHAR(500) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // ratings table: users can rate recipes 1-5
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ratings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                recipe_id INT NOT NULL,
                user_id INT,
                rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_recipe_user (recipe_id, user_id),
                FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        console.log('Ensured recipe/comment/rating tables exist');
    } catch (err) {
        console.error('Error ensuring tables exist:', err);
    }
})();
// Recipe routes
const recipeRoutes = require('./DataBase/routes/recipes');
app.use('/api/recipes', recipeRoutes);

// Comment routes
const commentRoutes = require('./DataBase/routes/comments');
app.use('/api/comments', commentRoutes);

// Rating routes
const ratingRoutes = require('./DataBase/routes/ratings');
app.use('/api/ratings', ratingRoutes);

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));