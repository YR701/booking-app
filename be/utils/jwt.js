// Author: Jenny Hua
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function buildToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
}

module.exports = { buildToken };
