const express = require('express');
const path = require('path');
const multer = require('multer');
const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${uniqueSuffix}-${sanitized}`);
    }
});

// Error handling for multer
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: 'File upload error: ' + err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
};

// Controllers for recipes, comments, and ratings
const {
    createRecipe,
    getRecipes,
    getRecipeById,
    getMyRecipes,
    updateRecipe
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

// Protected route to create a recipe (requires auth)
// Must be BEFORE /:id route so "POST /" matches before "GET /:id"
router.post('/', authenticateToken, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
                }
                return res.status(400).json({ error: 'File upload error: ' + err.message });
            } else {
                return res.status(400).json({ error: err.message });
            }
        }
        next();
    });
}, createRecipe);

// Public route to fetch all recipes (public feed)
router.get('/', getRecipes);

// Protected route to fetch only the current user's recipes (requires auth)
router.get('/my', authenticateToken, getMyRecipes);

// Protected route to update a recipe (requires auth + ownership)
router.put('/:id', authenticateToken, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
                }
                return res.status(400).json({ error: 'File upload error: ' + err.message });
            } else {
                return res.status(400).json({ error: err.message });
            }
        }
        next();
    });
}, updateRecipe);

// Public route to fetch a single recipe by ID
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
