// Author: Jenny Hua
const express = require('express');
const { readStore } = require('../store');
const { publicUser } = require('../utils/users');
const { formatSlot } = require('../utils/slotFormat');
const { authMiddleware, ownerOnly } = require('../middleware/auth');
const { APP_URL } = require('../config');

const router = express.Router();

router.get('/owners', authMiddleware, async (_req, res) => {
  const store = await readStore();
  const owners = store.users
    .filter((user) => user.role === 'owner')
    .map((owner) => ({
      ...publicUser(owner),
      activeSlotCount: store.slots.filter(
        (slot) => slot.ownerId === owner.id && slot.isActive,
      ).length,
    }))
    .filter((owner) => owner.activeSlotCount > 0)
    .sort((left, right) => left.name.localeCompare(right.name));

  res.json({ owners });
});

router.get('/owners/:ownerId/slots', authMiddleware, async (req, res) => {
  const store = await readStore();
  const { ownerId } = req.params;
  const owner = store.users.find((user) => user.id === ownerId && user.role === 'owner');

  if (!owner) {
    return res.status(404).json({ error: 'Owner not found.' });
  }

  const slots = store.slots
    .filter((slot) => slot.ownerId === ownerId)
    .filter((slot) => slot.isActive)
    .sort((left, right) => left.start.localeCompare(right.start))
    .map((slot) => formatSlot(store, slot));

  return res.json({
    owner: publicUser(owner),
    slots,
  });
});

router.get('/owner/slots', authMiddleware, ownerOnly, async (req, res) => {
  const store = await readStore();
  const slots = store.slots
    .filter((slot) => slot.ownerId === req.user.id)
    .sort((left, right) => left.start.localeCompare(right.start))
    .map((slot) => formatSlot(store, slot));

  res.json({
    invitationUrl: `${APP_URL}/?invite=${req.user.id}`,
    slots,
  });
});

module.exports = router;
