// Import the MySQL2 library (promise version)
// This allows us to use async/await when interacting with the database
const mysql = require('mysql2/promise');

// Load environment variables from the .env file
// (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, etc.)
require('dotenv').config();

// Create a connection pool to the MySQL database
// A pool manages multiple connections efficiently so the server
// can handle many requests without opening a new connection each time.
const pool = mysql.createPool({
    host: process.env.DB_HOST,       // Database server address
    port: process.env.DB_PORT,       // Port MySQL is running on
    user: process.env.DB_USER,       // MySQL username
    password: process.env.DB_PASSWORD, // MySQL password
    database: process.env.DB_NAME,   // Database name to use
    connectionLimit: 10              // Max number of connections in the pool
});


(async () => {
    try {
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS shopping_list LONGTEXT");
        console.log(" Database: 'shopping_list' column verified/added.");
    } catch (err) {
        if (err.code !== 'ER_DUP_COLUMN_NAME') {
            console.error(" Database initialization error:", err.message);
        } else {
            console.log("ℹ Database: 'shopping_list' column already exists.");
        }
    }
})();

// Export the pool so other files (controllers, routes, etc.)
// can run queries using the same shared connection pool.
module.exports = pool;