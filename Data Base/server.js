
const express = require('express');
const app = express();

app.use(express.json());

// 1. Import the database pool BEFORE routes
const pool = require('./db/pool');

// 2. Define routes BEFORE app.listen()

// Root route
app.get('/', (req, res) => {
    res.send("Server is running!");
});

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

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);



// 3. Start the server LAST
app.listen(3000, () => console.log("Server running on port 3000"));