const express = require('express');
const router = express.Router();

// Controllers for recipes
const {
    createRecipe,
    getRecipes,
    getRecipeById,
    updateRecipe //  ADDED
} = require('../controllers/recipesController');

// Controllers for comments
const {
    getCommentsForRecipe,
    postComment
} = require('../controllers/commentsController');

// Controllers for ratings
const {
    getRatingsForRecipe,
    postRating
} = require('../controllers/ratingsController');

// Auth middleware
const { authenticateToken } = require('../middleware/authMiddleware');


// =====================
// RECIPES ROUTES
// =====================

// Get all recipes (public feed)
router.get('/', getRecipes);

// Get a single recipe by ID
router.get('/:id', getRecipeById);

// Create a recipe (requires login)
router.post('/', authenticateToken, createRecipe);

// UPDATE RECIPE (THIS WAS MISSING)
router.put('/:id', authenticateToken, updateRecipe);


// =====================
// COMMENTS ROUTES
// =====================

// Get all comments for a recipe
router.get('/:id/comments', getCommentsForRecipe);

// Post a comment (requires login)
router.post('/:id/comments', authenticateToken, postComment);


// =====================
// RATINGS ROUTES
// =====================

// Get ratings for a recipe
router.get('/:id/ratings', getRatingsForRecipe);

// Post a rating (requires login)
router.post('/:id/ratings', authenticateToken, postRating);


module.exports = router;
