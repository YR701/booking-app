// Author: Jenny Hua
const express = require('express');
const pool = require('../../db/db');
const { SLOT_SELECT, formatSlot } = require('../utils/slotFormat');
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

  const [result] = await pool.execute(
    `INSERT INTO slots (owner_id, title, start_time, end_time, location, notes, is_active, booked_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, 0, NULL)`,
    [req.user.id, title, new Date(start), new Date(end), location, notes || null],
  );
  const [rows] = await pool.execute(
    `${SLOT_SELECT}
     WHERE s.id = ?
     LIMIT 1`,
    [result.insertId],
  );

  res.status(201).json({ slot: formatSlot(rows[0]) });
});

router.patch('/slots/:slotId/activate', authMiddleware, ownerOnly, async (req, res) => {
  const isActive = Boolean(req.body.isActive);
  const [updateResult] = await pool.execute(
    'UPDATE slots SET is_active = ? WHERE id = ? AND owner_id = ?',
    [isActive ? 1 : 0, req.params.slotId, req.user.id],
  );

  if (!updateResult.affectedRows) {
    return res.status(404).json({ error: 'Slot not found.' });
  }

  const [rows] = await pool.execute(
    `${SLOT_SELECT}
     WHERE s.id = ? AND s.owner_id = ?
     LIMIT 1`,
    [req.params.slotId, req.user.id],
  );

  return res.json({ slot: formatSlot(rows[0]) });
});

router.delete('/slots/:slotId', authMiddleware, ownerOnly, async (req, res) => {
  const [rows] = await pool.execute(
    `${SLOT_SELECT}
     WHERE s.id = ? AND s.owner_id = ?
     LIMIT 1`,
    [req.params.slotId, req.user.id],
  );
  const slot = rows[0];

  if (!slot) {
    return res.status(404).json({ error: 'Slot not found.' });
  }

  await pool.execute('DELETE FROM slots WHERE id = ? AND owner_id = ?', [
    req.params.slotId,
    req.user.id,
  ]);

  return res.json({
    deletedSlotId: slot.id,
    notificationMailto: slot.bookedUserIdValue
      ? buildMailto(
          slot.bookedUserEmail,
          'Booking slot deleted',
          `Hello ${slot.bookedUserName},\n\nThe slot "${slot.title}" was deleted and is no longer available.`,
        )
      : null,
  });
});

router.post('/slots/:slotId/book', authMiddleware, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, owner_id AS ownerId, is_active AS isActive, booked_by_user_id AS bookedByUserId FROM slots WHERE id = ? LIMIT 1',
    [req.params.slotId],
  );
  const slot = rows[0];

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

  const [updateResult] = await pool.execute(
    `UPDATE slots
     SET booked_by_user_id = ?
     WHERE id = ? AND booked_by_user_id IS NULL AND is_active = 1`,
    [req.user.id, req.params.slotId],
  );

  if (!updateResult.affectedRows) {
    return res.status(409).json({ error: 'That slot has already been reserved.' });
  }

  const [slotRows] = await pool.execute(
    `${SLOT_SELECT}
     WHERE s.id = ?
     LIMIT 1`,
    [req.params.slotId],
  );

  return res.json({ slot: formatSlot(slotRows[0]) });
});

router.delete('/slots/:slotId/booking', authMiddleware, async (req, res) => {
  const [rows] = await pool.execute(
    `${SLOT_SELECT}
     WHERE s.id = ?
     LIMIT 1`,
    [req.params.slotId],
  );
  const slot = rows[0];

  if (!slot || slot.bookedByUserId !== req.user.id) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  await pool.execute(
    'UPDATE slots SET booked_by_user_id = NULL WHERE id = ? AND booked_by_user_id = ?',
    [req.params.slotId, req.user.id],
  );
  const [updatedRows] = await pool.execute(
    `${SLOT_SELECT}
     WHERE s.id = ?
     LIMIT 1`,
    [req.params.slotId],
  );

  return res.json({
    slot: formatSlot(updatedRows[0]),
    notificationMailto: slot.ownerUserId
      ? buildMailto(
          slot.ownerEmail,
          'Booking cancelled',
          `Hello ${slot.ownerName},\n\nThe booking for "${slot.title}" has been cancelled and the slot is available again.`,
        )
      : null,
  });
});

module.exports = router;
