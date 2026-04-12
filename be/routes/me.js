// Author: Jenny Hua
const express = require('express');
const { readStore } = require('../store');
const { formatSlot } = require('../utils/slotFormat');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/me/bookings', authMiddleware, async (req, res) => {
  const store = await readStore();
  const bookings = store.slots
    .filter((slot) => slot.bookedByUserId === req.user.id)
    .sort((left, right) => left.start.localeCompare(right.start))
    .map((slot) => formatSlot(store, slot));

  res.json({ bookings });
});

module.exports = router;
