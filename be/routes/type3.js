/* Author: Hanjing Zheng */

const express = require('express');
const pool = require('../../db/db');
const { authMiddleware, ownerOnly } = require('../middleware/auth');
const { publicUser } = require('../utils/users');
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
        (owner_id, title, start_time, end_time, location, notes, is_active, capacity, is_full)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, 0)`,
      [req.user.id, title, new Date(start), new Date(end), location, notes || null, capacity]
    );

    const [rows] = await pool.execute(
      `${TYPE3_SLOT_SELECT}
       WHERE s.id = ?
       GROUP BY
         s.id, s.owner_id, s.title, s.start_time, s.end_time, s.location, s.notes, s.is_active, s.capacity, s.is_full,
         owner.id, owner.name, owner.email, owner.role
       LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({ slot: formatType3Slot(rows[0], req.user.id) });
  } catch (error) {
    console.error('Create Type 3 slot error:', error);
    return res.status(500).json({ error: 'Unable to create Type 3 slot.' });
  }
});

/** API interface: list owners who currently have active, not-full Type 3 slots */
router.get('/type3/owners', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        COUNT(s.id) AS activeType3SlotCount
      FROM users u
      JOIN type3_slots s
        ON s.owner_id = u.id
       AND s.is_active = 1
       AND s.is_full = 0
      WHERE u.role = 'owner'
      GROUP BY u.id, u.name, u.email, u.role
      ORDER BY u.name ASC
    `);

    const owners = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      activeType3SlotCount: Number(row.activeType3SlotCount || 0),
    }));

    return res.json({ owners });
  } catch (error) {
    console.error('Get Type 3 owners error:', error);
    return res.status(500).json({ error: 'Unable to fetch Type 3 owners.' });
  }
});

/** Existing general public Type 3 list
 * Also supports query param ?ownerId=123 for filtering */
router.get('/type3/slots', authMiddleware, async (req, res) => {
  try {
    const ownerId = String(req.query.ownerId || '').trim();

    let sql = `
      SELECT
        s.id,
        s.owner_id AS ownerId,
        s.title,
        s.start_time AS start,
        s.end_time AS end,
        s.location,
        s.notes,
        s.is_active AS isActive,
        s.capacity,
        s.is_full AS isFull,
        owner.id AS ownerUserId,
        owner.name AS ownerName,
        owner.email AS ownerEmail,
        owner.role AS ownerRole,
        COUNT(b.id) AS bookedCount,
        MAX(CASE WHEN b.user_id = ? THEN 1 ELSE 0 END) AS reservedByMe
      FROM type3_slots s
      JOIN users owner ON owner.id = s.owner_id
      LEFT JOIN type3_slot_bookings b ON b.slot_id = s.id
      WHERE s.is_active = 1
    `;

    const params = [req.user.id];

    if (ownerId) {
      sql += ` AND s.owner_id = ?`;
      params.push(ownerId);
    }

    sql += `
      GROUP BY
        s.id, s.owner_id, s.title, s.start_time, s.end_time, s.location, s.notes, s.is_active, s.capacity, s.is_full,
        owner.id, owner.name, owner.email, owner.role
      ORDER BY s.start_time ASC
    `;

    const [rows] = await pool.execute(sql, params);

    return res.json({ slots: rows.map((row) => formatType3Slot(row, req.user.id)) });
  } catch (error) {
    console.error('Get Type 3 slots error:', error);
    return res.status(500).json({ error: 'Unable to fetch Type 3 slots.' });
  }
});

/** API interface: public Type 3 slots for a specific owner */
router.get('/type3/owners/:ownerId/slots', authMiddleware, async (req, res) => {
  try {
    const { ownerId } = req.params;

    const [ownerRows] = await pool.execute(
      'SELECT id, name, email, role FROM users WHERE id = ? AND role = ? LIMIT 1',
      [ownerId, 'owner'],
    );
    const owner = ownerRows[0];

    if (!owner) {
      return res.status(404).json({ error: 'Owner not found.' });
    }

    const [rows] = await pool.execute(
      `
      SELECT
        s.id,
        s.owner_id AS ownerId,
        s.title,
        s.start_time AS start,
        s.end_time AS end,
        s.location,
        s.notes,
        s.is_active AS isActive,
        s.capacity,
        s.is_full AS isFull,
        owner.id AS ownerUserId,
        owner.name AS ownerName,
        owner.email AS ownerEmail,
        owner.role AS ownerRole,
        COUNT(b.id) AS bookedCount,
        MAX(CASE WHEN b.user_id = ? THEN 1 ELSE 0 END) AS reservedByMe
      FROM type3_slots s
      JOIN users owner ON owner.id = s.owner_id
      LEFT JOIN type3_slot_bookings b ON b.slot_id = s.id
      WHERE s.owner_id = ? AND s.is_active = 1
      GROUP BY
        s.id, s.owner_id, s.title, s.start_time, s.end_time, s.location, s.notes, s.is_active, s.capacity, s.is_full,
        owner.id, owner.name, owner.email, owner.role
      ORDER BY s.start_time ASC
      `,
      [req.user.id, ownerId]
    );

    return res.json({
      owner: publicUser(owner),
      slots: rows.map((row) => formatType3Slot(row, req.user.id)),
    });
  } catch (error) {
    console.error('Get Type 3 owner public slots error:', error);
    return res.status(500).json({ error: 'Unable to fetch Type 3 owner slots.' });
  }
});

router.get('/type3/owner/slots', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `${TYPE3_SLOT_SELECT}
       WHERE s.owner_id = ?
       GROUP BY
         s.id, s.owner_id, s.title, s.start_time, s.end_time, s.location, s.notes, s.is_active, s.capacity, s.is_full,
         owner.id, owner.name, owner.email, owner.role
       ORDER BY s.start_time ASC`,
      [req.user.id]
    );

    return res.json({ slots: rows.map((row) => formatType3Slot(row, req.user.id)) });
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
      await connection.execute(
        `UPDATE type3_slots
         SET is_full = 1
         WHERE id = ?`,
        [slotId]
      );
      await connection.rollback();
      return res.status(409).json({ error: 'That slot has reached full capacity.' });
    }

    await connection.execute(
      `INSERT INTO type3_slot_bookings (slot_id, user_id)
       VALUES (?, ?)`,
      [slotId, req.user.id]
    );

    const [updatedCountRows] = await connection.execute(
      `SELECT COUNT(*) AS bookedCount
       FROM type3_slot_bookings
       WHERE slot_id = ?`,
      [slotId]
    );

    const updatedBookedCount = Number(updatedCountRows[0].bookedCount || 0);
    const isFull = updatedBookedCount >= Number(slot.capacity) ? 1 : 0;

    await connection.execute(
      `UPDATE type3_slots
       SET is_full = ?
       WHERE id = ?`,
      [isFull, slotId]
    );

    await connection.commit();

    const [rows] = await pool.execute(
      `
      SELECT
        s.id,
        s.owner_id AS ownerId,
        s.title,
        s.start_time AS start,
        s.end_time AS end,
        s.location,
        s.notes,
        s.is_active AS isActive,
        s.capacity,
        s.is_full AS isFull,
        owner.id AS ownerUserId,
        owner.name AS ownerName,
        owner.email AS ownerEmail,
        owner.role AS ownerRole,
        COUNT(b.id) AS bookedCount,
        MAX(CASE WHEN b.user_id = ? THEN 1 ELSE 0 END) AS reservedByMe
      FROM type3_slots s
      JOIN users owner ON owner.id = s.owner_id
      LEFT JOIN type3_slot_bookings b ON b.slot_id = s.id
      WHERE s.id = ?
      GROUP BY
        s.id, s.owner_id, s.title, s.start_time, s.end_time, s.location, s.notes, s.is_active, s.capacity, s.is_full,
        owner.id, owner.name, owner.email, owner.role
      LIMIT 1
      `,
      [req.user.id, slotId]
    );

    return res.json({ slot: formatType3Slot(rows[0], req.user.id) });
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