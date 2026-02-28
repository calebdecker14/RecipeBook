require('dotenv').config();   // <--- REQUIRED

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());              // <--- REQUIRED for frontend to talk to backend
app.use(express.json());

// Import DB pool
const pool = require('./db/pool');

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
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));