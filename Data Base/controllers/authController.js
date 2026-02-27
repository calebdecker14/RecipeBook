// Import the MySQL connection pool
const pool = require('../db/pool');

// Library for hashing passwords securely
const bcrypt = require('bcrypt');

// Library for creating signed JSON Web Tokens (JWTs)
const jwt = require('jsonwebtoken');


// REGISTER CONTROLLER
exports.register = async (req, res) => {
    // Extract user input from the request body
    const { username, email, password } = req.body;

    try {
        // Hash the user's password with a salt round of 10
        // This ensures we never store plain-text passwords
        const hashed = await bcrypt.hash(password, 10);

        // SQL query to insert a new user into the database
        const sql = `
            INSERT INTO users (username, email, password_hash)
            VALUES (?, ?, ?)
        `;

        // Execute the SQL query using the connection pool
        await pool.query(sql, [username, email, hashed]);

        // Send success response
        res.json({ message: "User created successfully" });
    } catch (err) {
        // Log the error for debugging
        console.error(err);

        // Send a generic error message to the client
        res.status(500).json({ error: "Registration failed" });
    }
};



// LOGIN CONTROLLER
exports.login = async (req, res) => {
    // Extract login credentials from the request body
    const { username, password } = req.body;

    try {
        // Look up the user by username
        // I think this allows SQL injection, we might need to address this later
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        // If no user exists with that username, return an error
        if (rows.length === 0) {
            return res.status(400).json({ error: "User not found" });
        }

        // The user record from the database
        const user = rows[0];

        // Compare the provided password with the stored hashed password
        const match = await bcrypt.compare(password, user.password_hash);

        // If the password doesn't match, return an error
        if (!match) {
            return res.status(400).json({ error: "Invalid password" });
        }

        // Create a signed JWT containing the user's id and username
        // The token expires in 1 hour
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Send the token back to the client
        res.json({ token });
    } catch (err) {
        // Log the error for debugging
        console.error(err);

        // Send a generic error message to the client
        res.status(500).json({ error: "Login failed" });
    }
};