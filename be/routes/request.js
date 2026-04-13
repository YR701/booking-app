/* Author: Yongrong Yang */
const express = require('express');
const router = express.Router();
const pool = require('../../db/db');
const { authMiddleware } = require('../middleware/auth');
const { REQUEST_SELECT, formatRequest } = require('../utils/requestFormat');

router.post('/meetings/request', authMiddleware, async (req, res) => {
    const { ownerId, title, startTime, endTime, reason } = req.body;

    if (!ownerId || !title || !startTime || !endTime || !reason) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const [result] = await pool.execute(
            `INSERT INTO request (requester_id, owner_id, title, start_time, end_time, reason, status)
             VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
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
        const [rows] = await pool.execute(
            `${REQUEST_SELECT}
             WHERE r.requester_id = ? 
             ORDER BY r.created_at DESC`,
            [req.user.id]
        );
        const requests = rows.map(formatRequest);
        return res.json({ requests });
    } catch (error) {
        console.error('Error fetching meeting requests:', error);
        return res.status(500).json({ error: 'Error fetching meeting requests' });
    }
});

module.exports = router;

