// Author: Jenny Hua
const express = require('express');
const pool = require('../../db/db');
const { SLOT_SELECT, formatSlot } = require('../utils/slotFormat');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/me/bookings', authMiddleware, async (req, res) => {
  const [rows] = await pool.execute(
    `${SLOT_SELECT}
     WHERE s.booked_by_user_id = ?
     ORDER BY s.start_time ASC`,
    [req.user.id],
  );
  const bookings = rows.map(formatSlot);

  res.json({ bookings });
});

module.exports = router;
