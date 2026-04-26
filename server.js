require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use('/uploads', express.static('uploads'));

// Middleware
app.use(cors());
app.use(express.json());

const recipeRoutes = require('./DataBase/routes/recipes');
app.use('/recipes', recipeRoutes);
app.use('/api/recipes', recipeRoutes);
// -----------------------------------------

app.use(express.static(path.join(__dirname, 'Frontend')));

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



// Comments routesS
const commentRoutes = require('./DataBase/routes/comments');
app.use('/comments', commentRoutes);
app.use('/api/comments', commentRoutes);

// Ratings routes
const ratingRoutes = require('./DataBase/routes/ratings');
app.use('/ratings', ratingRoutes);
app.use('/api/ratings', ratingRoutes);

// Follows routes
const followsRoutes = require('./DataBase/routes/follows');
app.use('/follows', followsRoutes);

// Shopping list routes
const shoppingRoutes = require('./DataBase/routes/shopping');
app.use('/api/shopping-list', shoppingRoutes);

//Calendar & Meal Plan routes
const mealPlanRoutes = require("./DataBase/routes/mealPlanRoutes");
app.use("/mealplan", mealPlanRoutes);


// Ensure user_follows table exists
pool.query(`
    CREATE TABLE IF NOT EXISTS user_follows (
        follower_id  INT NOT NULL,
        following_id INT NOT NULL,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (follower_id, following_id),
        FOREIGN KEY (follower_id)  REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
    )
`).catch(err => console.error('user_follows table creation failed:', err));



function print(path, layer) {
  if (layer.route) {
    layer.route.stack.forEach(print.bind(null, path + (layer.route.path === '/' ? '' : layer.route.path)))
  } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
    // Added a check (layer.handle && layer.handle.stack) to prevent the error
    layer.handle.stack.forEach(print.bind(null, path + (layer.regexp.source.replace('\\/?(?=\\/|$)', '').replace('^\\/', ''))))
  } else if (layer.method) {
    console.log('%s /%s', layer.method.toUpperCase(), path.split('/').filter(Boolean).join('/'))
  }
}

if (app._router && app._router.stack) {
    app._router.stack.forEach(print.bind(null, ''));
}

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});