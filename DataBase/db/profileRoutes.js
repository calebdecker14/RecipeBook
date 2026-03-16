const express = require('express');
const router = express.Router();
const db = require('./pool');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/authMiddleware');

// ----------------------
// Multer Setup
// ----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile_${req.user.id}${ext}`);
  }
});

const upload = multer({ storage });

// ----------------------
// GET /profile/me
// ----------------------
router.get('/me', authenticateToken, async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, username, email, profile_pic, bio FROM users WHERE id = ?',
    [req.user.id]
  );

  res.json(rows[0]);
});

// ----------------------
// PUT /profile/update
// ----------------------
router.put('/update', authenticateToken, async (req, res) => {
  const { username, email } = req.body;

  await db.query(
    'UPDATE users SET username = ?, email = ? WHERE id = ?',
    [username, email, req.user.id]
  );

  res.json({ message: 'Profile updated' });
});

// ----------------------
// PUT /profile/password
// ----------------------
router.put('/password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const [rows] = await db.query(
    'SELECT password_hash FROM users WHERE id = ?',
    [req.user.id]
  );

  const user = rows[0];

  const match = await bcrypt.compare(oldPassword, user.password_hash);
  if (!match) return res.status(400).json({ message: 'Incorrect old password' });

  const hashed = await bcrypt.hash(newPassword, 10);

  await db.query(
    'UPDATE users SET password_hash = ? WHERE id = ?',
    [hashed, req.user.id]
  );

  res.json({ message: 'Password updated' });
});

// ----------------------
// PUT /profile/bio
// ----------------------
router.put('/bio', authenticateToken, async (req, res) => {
  const { bio } = req.body;

  await db.query(
    'UPDATE users SET bio = ? WHERE id = ?',
    [bio, req.user.id]
  );

  res.json({ message: 'Bio updated' });
});

// ----------------------
// POST /profile/profile-pic
// ----------------------
router.post('/profile-pic', authenticateToken, upload.single('image'), async (req, res) => {
  const filePath = `/uploads/${req.file.filename}`;

  await db.query(
    'UPDATE users SET profile_pic = ? WHERE id = ?',
    [filePath, req.user.id]
  );

  res.json({ message: 'Profile picture updated', profile_pic: filePath });
});

// ----------------------
// DELETE /profile/delete
// ----------------------
router.delete('/delete', authenticateToken, async (req, res) => {
  await db.query('DELETE FROM users WHERE id = ?', [req.user.id]);
  res.json({ message: 'Account deleted' });
});

module.exports = router;