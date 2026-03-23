require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use('/uploads', express.static('uploads'));

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'Frontend')));

// Root route → serve Index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Frontend', 'Index.html'));
});

// Import DB pool
const pool = require('./DataBase/db/pool');

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

// Profile routes
const profileRoutes = require('./DataBase/routes/profileRoutes');
app.use('/profile', profileRoutes);


// Recipes routes
const recipeRoutes = require('./DataBase/routes/recipes');
app.use('/recipes', recipeRoutes);

// Comments routesS
const commentRoutes = require('./DataBase/routes/comments');
app.use('/comments', commentRoutes);

// Ratings routes
const ratingRoutes = require('./DataBase/routes/ratings');
app.use('/ratings', ratingRoutes);

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});