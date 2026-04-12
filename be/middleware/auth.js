// Author: Jenny Hua
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { readStore } = require('../store');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    const store = await readStore();
    const user = store.users.find((entry) => entry.id === payload.sub);

    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    req.store = store;
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

function ownerOnly(req, res, next) {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only @mcgill.ca owners can do that.' });
  }

  return next();
}

module.exports = {
  authMiddleware,
  ownerOnly,
};
