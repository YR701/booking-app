/* Author: Hanjing Zheng */

const express = require('express');
const pool = require('../../db/db');
const { authMiddleware, ownerOnly } = require('../middleware/auth');
const { TYPE3_SLOT_SELECT, formatType3Slot } = require('../utils/type3SlotFormat');

const router = express.Router();

router.post('/type3/slots', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const start = String(req.body.start || '').trim();
    const end = String(req.body.end || '').trim();
    const location = String(req.body.location || '').trim();
    const notes = String(req.body.notes || '').trim();
    const capacity = Number(req.body.capacity || 1);

    if (!title || !start || !end) {
      return res.status(400).json({ error: 'Title, start time, and end time are required.' });
    }

    if (new Date(start).getTime() >= new Date(end).getTime()) {
      return res.status(400).json({ error: 'End time must be after the start time.' });
    }

    if (capacity < 1) {
      return res.status(400).json({ error: 'Capacity must be at least 1.' });
    }

    const [result] = await pool.execute(
      `INSERT INTO type3_slots
        (owner_id, title, start_time, end_time, location, notes, is_active, capacity)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [req.user.id, title, new Date(start), new Date(end), location, notes || null, capacity]
    );

    const [rows] = await pool.execute(
      `${TYPE3_SLOT_SELECT}
       WHERE s.id = ?
       GROUP BY
         s.id, s.owner_id, s.title, s.start_time, s.end_time, s.location, s.notes, s.is_active, s.capacity,
         owner.id, owner.name, owner.email, owner.role
       LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({ slot: formatType3Slot(rows[0]) });
  } catch (error) {
    console.error('Create Type 3 slot error:', error);
    return res.status(500).json({ error: 'Unable to create Type 3 slot.' });
  }
});

router.get('/type3/slots', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `${TYPE3_SLOT_SELECT}
       WHERE s.is_active = 1
       GROUP BY
         s.id, s.owner_id, s.title, s.start_time, s.end_time, s.location, s.notes, s.is_active, s.capacity,
         owner.id, owner.name, owner.email, owner.role
       ORDER BY s.start_time ASC`
    );

    return res.json({ slots: rows.map(formatType3Slot) });
  } catch (error) {
    console.error('Get Type 3 slots error:', error);
    return res.status(500).json({ error: 'Unable to fetch Type 3 slots.' });
  }
});

router.get('/type3/owner/slots', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `${TYPE3_SLOT_SELECT}
       WHERE s.owner_id = ?
       GROUP BY
         s.id, s.owner_id, s.title, s.start_time, s.end_time, s.location, s.notes, s.is_active, s.capacity,
         owner.id, owner.name, owner.email, owner.role
       ORDER BY s.start_time ASC`,
      [req.user.id]
    );

    return res.json({ slots: rows.map(formatType3Slot) });
  } catch (error) {
    console.error('Get owner Type 3 slots error:', error);
    return res.status(500).json({ error: 'Unable to fetch owner Type 3 slots.' });
  }
});

router.post('/type3/slots/:slotId/book', authMiddleware, async (req, res) => {
  const slotId = Number(req.params.slotId);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [slotRows] = await connection.execute(
      `SELECT id, owner_id, is_active, capacity
       FROM type3_slots
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [slotId]
    );

    const slot = slotRows[0];

    if (!slot) {
      await connection.rollback();
      return res.status(404).json({ error: 'Slot not found.' });
    }

    if (!slot.is_active) {
      await connection.rollback();
      return res.status(400).json({ error: 'Only active slots can be reserved.' });
    }

    if (slot.owner_id === req.user.id) {
      await connection.rollback();
      return res.status(400).json({ error: 'Owners cannot reserve their own slot.' });
    }

    const [countRows] = await connection.execute(
      `SELECT COUNT(*) AS bookedCount
       FROM type3_slot_bookings
       WHERE slot_id = ?`,
      [slotId]
    );

    const bookedCount = Number(countRows[0].bookedCount || 0);

    if (bookedCount >= Number(slot.capacity)) {
      await connection.rollback();
      return res.status(409).json({ error: 'That slot has reached full capacity.' });
    }

    await connection.execute(
      `INSERT INTO type3_slot_bookings (slot_id, user_id)
       VALUES (?, ?)`,
      [slotId, req.user.id]
    );

    await connection.commit();

    const [rows] = await pool.execute(
      `${TYPE3_SLOT_SELECT}
       WHERE s.id = ?
       GROUP BY
         s.id, s.owner_id, s.title, s.start_time, s.end_time, s.location, s.notes, s.is_active, s.capacity,
         owner.id, owner.name, owner.email, owner.role
       LIMIT 1`,
      [slotId]
    );

    return res.json({ slot: formatType3Slot(rows[0]) });
  } catch (error) {
    await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'You have already reserved this slot.' });
    }

    console.error('Book Type 3 slot error:', error);
    return res.status(500).json({ error: 'Unable to reserve Type 3 slot.' });
  } finally {
    connection.release();
  }
});

router.delete('/type3/slots/:slotId', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const slotId = Number(req.params.slotId);

    const [rows] = await pool.execute(
      `
      SELECT id, owner_id AS ownerId
      FROM type3_slots
      WHERE id = ?
      LIMIT 1
      `,
      [slotId]
    );

    const slot = rows[0];

    if (!slot) {
      return res.status(404).json({ error: 'Type 3 slot not found.' });
    }

    if (Number(slot.ownerId) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to delete this Type 3 slot.' });
    }

    await pool.execute(
      `DELETE FROM type3_slots WHERE id = ?`,
      [slotId]
    );

    return res.json({
      deletedSlotId: slotId,
      message: 'Type 3 slot deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Type 3 slot error:', error);
    return res.status(500).json({ error: 'Unable to delete Type 3 slot.' });
  }
});

module.exports = router;