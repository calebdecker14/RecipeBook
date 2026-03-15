const express = require('express');
const router = express.Router();

// Controllers for recipes, comments, and ratings
const {
    createRecipe,
    getRecipes,
    getRecipeById
} = require('../controllers/recipesController');
const {
    getCommentsForRecipe,
    postComment
} = require('../controllers/commentsController');
const {
    getRatingsForRecipe,
    postRating
} = require('../controllers/ratingsController');

const { authenticateToken } = require('../middleware/authMiddleware');

// Public route to fetch all recipes (public feed)
router.get('/', getRecipes);

// Public route to fetch a single recipe by ID
router.get('/:id', getRecipeById);

// Comments on a recipe
router.get('/:id/comments', getCommentsForRecipe);
router.post('/:id/comments', authenticateToken, postComment);

// Ratings on a recipe
router.get('/:id/ratings', getRatingsForRecipe);
router.post('/:id/ratings', authenticateToken, postRating);

// Protected route to create a recipe (requires auth)
router.post('/', authenticateToken, createRecipe);

module.exports = router;
