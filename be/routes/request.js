/* Author: Yongrong Yang */
const express = require('express');
const router = express.Router();
const pool = require('../../db/db');
const { authMiddleware } = require('../middleware/auth');

router.post('/meetings/request', authMiddleware, async (req, res) => {
    const { ownerId, title, startTime, endTime, reason } = req.body;

    if (!ownerId || !title || !startTime || !endTime || !reason) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const [result] = await pool.execute(
            `INSERT INTO request (requester_id, owner_id, title, start_time, end_time, reason, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [req.user.id, ownerId, title, new Date(startTime), new Date(endTime), reason]
        );

        return res.status(201).json({ 
            success: true,
            message: 'Meeting request created successfully.',
            requestId: result.insertId
        });
    } catch (error) {
        console.error('Error creating meeting request:', error);
        return res.status(500).json({ error: 'Error creating meeting request' });
    }
});

router.get('/meetings/requests', authMiddleware, async (req, res) => {
    try {
        const [requests] = await pool.execute(
            `SELECT r.id, r.requester_id, r.owner_id, r.title, r.start_time, r.end_time, r.reason, r.status, u.name AS requester_name, o.name AS owner_name
             FROM request r
             JOIN users u ON r.requester_id = u.id
             JOIN users o ON r.owner_id = o.id
             WHERE r.requester_id = ?`,
            [req.user.id]
        );
        return res.json({ requests });
    } catch (error) {
        console.error('Error fetching meeting requests:', error);
        return res.status(500).json({ error: 'Error fetching meeting requests' });
    }
});

module.exports = router;

