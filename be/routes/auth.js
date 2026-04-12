// Author: Jenny Hua
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../../db/db');
const { publicUser } = require('../utils/users');
const { buildToken } = require('../utils/jwt');
const { isMcGillEmail, isOwnerEmail } = require('../utils/mcgill');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/auth/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (!isMcGillEmail(email)) {
    return res
      .status(400)
      .json({ error: 'Only @mcgill.ca and @mail.mcgill.ca addresses can register.' });
  }

  const [existingRows] = await pool.execute(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [email],
  );
  const existingUser = existingRows[0];

  if (existingUser) {
    return res.status(409).json({ error: 'That email is already registered.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const role = isOwnerEmail(email) ? 'owner' : 'student';
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, passwordhash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role],
  );
  const user = {
    id: result.insertId,
    name,
    email,
    role,
  };

  res.status(201).json({
    token: buildToken(user),
    user: publicUser(user),
  });
});

router.post('/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const [rows] = await pool.execute(
    'SELECT id, name, email, passwordhash, role FROM users WHERE email = ? LIMIT 1',
    [email],
  );
  const row = rows[0];
  const user = row
    ? {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.passwordhash,
        role: row.role,
      }
    : null;

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  return res.json({
    token: buildToken(user),
    user: publicUser(user),
  });
});

router.get('/auth/me', authMiddleware, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1',
    [req.user.id],
  );
  const freshUser = rows[0];
  if (!freshUser) {
    return res.status(401).json({ error: 'User account no longer exists.' });
  }

  res.json({ user: publicUser(freshUser) });
});

module.exports = router;
