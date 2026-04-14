// Author: Jenny Hua
const express = require('express');
const pool = require('../../db/db');
const { publicUser } = require('../utils/users');
const { SLOT_SELECT, formatSlot } = require('../utils/slotFormat');
const { authMiddleware, ownerOnly } = require('../middleware/auth');
const { APP_URL } = require('../config');

const router = express.Router();

router.get('/owners', authMiddleware, async (_req, res) => {
  const [rows] = await pool.execute(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      COUNT(s.id) AS activeSlotCount
    FROM users u
    JOIN slots s ON s.owner_id = u.id AND s.is_active = 1 AND s.booked_by_user_id IS NULL
    WHERE u.role = 'owner'
    GROUP BY u.id, u.name, u.email, u.role
    ORDER BY u.name ASC
  `);
  const owners = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    activeSlotCount: Number(row.activeSlotCount),
  }));

  res.json({ owners });
});

router.get('/owners/:ownerId/slots', authMiddleware, async (req, res) => {
  const { ownerId } = req.params;
  const [ownerRows] = await pool.execute(
    'SELECT id, name, email, role FROM users WHERE id = ? AND role = ? LIMIT 1',
    [ownerId, 'owner'],
  );
  const owner = ownerRows[0];

  if (!owner) {
    return res.status(404).json({ error: 'Owner not found.' });
  }

  const [slotRows] = await pool.execute(
    `${SLOT_SELECT}
     WHERE s.owner_id = ? AND s.is_active = 1 AND s.booked_by_user_id IS NULL
     ORDER BY s.start_time ASC`,
    [ownerId],
  );
  const slots = slotRows.map(formatSlot);

  return res.json({
    owner: publicUser(owner),
    slots,
  });
});

router.get('/owner/slots', authMiddleware, ownerOnly, async (req, res) => {
  const [slotRows] = await pool.execute(
    `${SLOT_SELECT}
     WHERE s.owner_id = ?
     ORDER BY s.start_time ASC`,
    [req.user.id],
  );
  const slots = slotRows.map(formatSlot);

  res.json({
    invitationUrl: `${APP_URL}/?invite=${req.user.id}`,
    slots,
  });
});

module.exports = router;
