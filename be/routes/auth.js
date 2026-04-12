// Author: Jenny Hua
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { readStore, writeStore } = require('../store');
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

  const store = await readStore();
  const existingUser = store.users.find((user) => user.email === email);

  if (existingUser) {
    return res.status(409).json({ error: 'That email is already registered.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    role: isOwnerEmail(email) ? 'owner' : 'student',
  };

  store.users.push(user);
  await writeStore(store);

  res.status(201).json({
    token: buildToken(user),
    user: publicUser(user),
  });
});

router.post('/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const store = await readStore();
  const user = store.users.find((entry) => entry.email === email);

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
  const freshStore = await readStore();
  const freshUser = freshStore.users.find((user) => user.id === req.user.id);
  if (!freshUser) {
    return res.status(401).json({ error: 'User account no longer exists.' });
  }

  res.json({ user: publicUser(freshUser) });
});

module.exports = router;
