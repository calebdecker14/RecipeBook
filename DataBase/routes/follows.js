const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /follows/followers  — list users who follow me
router.get('/followers', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT u.id, u.username, u.profile_pic
             FROM user_follows uf
             JOIN users u ON u.id = uf.follower_id
             WHERE uf.following_id = ?
             ORDER BY uf.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('followers error:', err);
        res.status(500).json({ error: 'Failed to fetch followers' });
    }
});

// GET /follows/following  — list users I follow
router.get('/following', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT u.id, u.username, u.profile_pic
             FROM user_follows uf
             JOIN users u ON u.id = uf.following_id
             WHERE uf.follower_id = ?
             ORDER BY uf.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('following error:', err);
        res.status(500).json({ error: 'Failed to fetch following list' });
    }
});

// GET /follows/status/:userId  — am I following this user?
router.get('/status/:userId', authenticateToken, async (req, res) => {
    const followingId = parseInt(req.params.userId, 10);
    if (Number.isNaN(followingId)) return res.status(400).json({ error: 'Invalid user id' });
    try {
        const [rows] = await pool.query(
            'SELECT 1 FROM user_follows WHERE follower_id = ? AND following_id = ?',
            [req.user.id, followingId]
        );
        res.json({ following: rows.length > 0 });
    } catch (err) {
        console.error('follow status error:', err);
        res.status(500).json({ error: 'Failed to check follow status' });
    }
});

// POST /follows/:userId  — follow a user
router.post('/:userId', authenticateToken, async (req, res) => {
    const followingId = parseInt(req.params.userId, 10);
    const followerId = req.user.id;
    if (Number.isNaN(followingId)) return res.status(400).json({ error: 'Invalid user id' });
    if (followingId === followerId) return res.status(400).json({ error: 'Cannot follow yourself' });
    try {
        await pool.query(
            'INSERT IGNORE INTO user_follows (follower_id, following_id) VALUES (?, ?)',
            [followerId, followingId]
        );
        res.json({ message: 'Followed' });
    } catch (err) {
        console.error('follow error:', err);
        res.status(500).json({ error: 'Failed to follow user' });
    }
});

// DELETE /follows/:userId  — unfollow a user
router.delete('/:userId', authenticateToken, async (req, res) => {
    const followingId = parseInt(req.params.userId, 10);
    const followerId = req.user.id;
    if (Number.isNaN(followingId)) return res.status(400).json({ error: 'Invalid user id' });
    try {
        await pool.query(
            'DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );
        res.json({ message: 'Unfollowed' });
    } catch (err) {
        console.error('unfollow error:', err);
        res.status(500).json({ error: 'Failed to unfollow user' });
    }
});

module.exports = router;
