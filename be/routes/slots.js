// Author: Jenny Hua
const express = require('express');
const crypto = require('crypto');
const { readStore, writeStore } = require('../store');
const { formatSlot } = require('../utils/slotFormat');
const { buildMailto } = require('../utils/mailto');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/slots', authMiddleware, ownerOnly, async (req, res) => {
  const title = String(req.body.title || '').trim();
  const start = String(req.body.start || '').trim();
  const end = String(req.body.end || '').trim();
  const location = String(req.body.location || '').trim();
  const notes = String(req.body.notes || '').trim();

  if (!title || !start || !end) {
    return res.status(400).json({ error: 'Title, start time, and end time are required.' });
  }

  if (new Date(start).getTime() >= new Date(end).getTime()) {
    return res.status(400).json({ error: 'End time must be after the start time.' });
  }

  const store = await readStore();
  const slot = {
    id: crypto.randomUUID(),
    ownerId: req.user.id,
    title,
    start,
    end,
    location,
    notes,
    isActive: false,
    bookedByUserId: null,
  };

  store.slots.push(slot);
  await writeStore(store);

  res.status(201).json({ slot: formatSlot(store, slot) });
});

router.patch('/slots/:slotId/activate', authMiddleware, ownerOnly, async (req, res) => {
  const isActive = Boolean(req.body.isActive);
  const store = await readStore();
  const slot = store.slots.find(
    (entry) => entry.id === req.params.slotId && entry.ownerId === req.user.id,
  );

  if (!slot) {
    return res.status(404).json({ error: 'Slot not found.' });
  }

  slot.isActive = isActive;
  await writeStore(store);

  return res.json({ slot: formatSlot(store, slot) });
});

router.delete('/slots/:slotId', authMiddleware, ownerOnly, async (req, res) => {
  const store = await readStore();
  const slotIndex = store.slots.findIndex(
    (entry) => entry.id === req.params.slotId && entry.ownerId === req.user.id,
  );

  if (slotIndex === -1) {
    return res.status(404).json({ error: 'Slot not found.' });
  }

  const [deletedSlot] = store.slots.splice(slotIndex, 1);
  const bookedUser = deletedSlot.bookedByUserId
    ? store.users.find((user) => user.id === deletedSlot.bookedByUserId)
    : null;

  await writeStore(store);

  return res.json({
    deletedSlotId: deletedSlot.id,
    notificationMailto: bookedUser
      ? buildMailto(
          bookedUser.email,
          'Booking slot deleted',
          `Hello ${bookedUser.name},\n\nThe slot "${deletedSlot.title}" was deleted and is no longer available.`,
        )
      : null,
  });
});

router.post('/slots/:slotId/book', authMiddleware, async (req, res) => {
  const store = await readStore();
  const slot = store.slots.find((entry) => entry.id === req.params.slotId);

  if (!slot) {
    return res.status(404).json({ error: 'Slot not found.' });
  }

  if (!slot.isActive) {
    return res.status(400).json({ error: 'Only active slots can be booked.' });
  }

  if (slot.ownerId === req.user.id) {
    return res.status(400).json({ error: 'Owners cannot reserve their own slot.' });
  }

  if (slot.bookedByUserId) {
    return res.status(409).json({ error: 'That slot has already been reserved.' });
  }

  slot.bookedByUserId = req.user.id;
  await writeStore(store);

  return res.json({ slot: formatSlot(store, slot) });
});

router.delete('/slots/:slotId/booking', authMiddleware, async (req, res) => {
  const store = await readStore();
  const slot = store.slots.find((entry) => entry.id === req.params.slotId);

  if (!slot || slot.bookedByUserId !== req.user.id) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const owner = store.users.find((user) => user.id === slot.ownerId);
  slot.bookedByUserId = null;
  await writeStore(store);

  return res.json({
    slot: formatSlot(store, slot),
    notificationMailto: owner
      ? buildMailto(
          owner.email,
          'Booking cancelled',
          `Hello ${owner.name},\n\nThe booking for "${slot.title}" has been cancelled and the slot is available again.`,
        )
      : null,
  });
});

module.exports = router;
