require('dotenv').config();   // <--- REQUIRED

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());              // <--- REQUIRED for frontend to talk to backend
app.use(express.json());


// Serve uploaded profile pictures
app.use('/uploads', express.static('uploads'));

// Mount routes
app.use('/profile', require('./DataBase/db/profileRoutes'));
app.use('/auth', require('./DataBase/routes/auth'));

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