const express = require('express');
const router = express.Router();
const shoppingController = require('../controllers/shoppingController');
const { authenticateToken } = require('../middleware/authMiddleware');

// This results in: GET /api/shopping-list/
router.get('/', authenticateToken, shoppingController.getShoppingList);

// This results in: POST /api/shopping-list/
router.post('/', authenticateToken, shoppingController.updateShoppingList);

module.exports = router;