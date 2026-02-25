// Import Express so we can create a router object
const express = require('express');
const router = express.Router();

// Import the controller functions that handle the actual logic
// register → creates a new user
// login → verifies user credentials and returns a JWT
const { register, login } = require('../controllers/authController');


// AUTH ROUTES

// POST /auth/register
// This route handles user registration.
// It passes the request to the "register" controller function.
router.post('/register', register);

// POST /auth/login
// This route handles user login.
// It passes the request to the "login" controller function.
router.post('/login', login);


// Export the router so server.js can mount it under /auth
module.exports = router;
lll