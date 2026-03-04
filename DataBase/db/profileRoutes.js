router.get('/me', authenticateToken, async (req, res) => {
  const user = await db.query('SELECT id, username, email, profile_pic FROM users WHERE id = ?', [req.user.id]);
  res.json(user[0]);
});

router.put('/update', authenticateToken, async (req, res) => {
  const { username, email } = req.body;

  await db.query(
    'UPDATE users SET username = ?, email = ? WHERE id = ?',
    [username, email, req.user.id]
  );

  res.json({ message: 'Profile updated' });
});

router.put('/password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const [user] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);

  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) return res.status(400).json({ message: 'Incorrect old password' });

  const hashed = await bcrypt.hash(newPassword, 10);

  await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

  res.json({ message: 'Password updated' });
});

router.post('/profile-pic', authenticateToken, upload.single('image'), async (req, res) => {
  const filePath = `/uploads/${req.file.filename}`;

  await db.query('UPDATE users SET profile_pic = ? WHERE id = ?', [filePath, req.user.id]);

  res.json({ message: 'Profile picture updated', profile_pic: filePath });
});

router.delete('/delete', authenticateToken, async (req, res) => {
  await db.query('DELETE FROM users WHERE id = ?', [req.user.id]);
  res.json({ message: 'Account deleted' });
});