/* Author: Yongrong Yang */

const express = require('express');
const router = express.Router();
const pool = require('../../db/db');
const { authMiddleware, ownerOnly } = require('../middleware/auth');
const { REQUEST_SELECT, formatRequest } = require('../utils/requestFormat');

// Create a new meeting request
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

// for user to see their own requests
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

// for owner to see requests sent to them
router.get('/meetings/requests/received', authMiddleware, ownerOnly, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `${REQUEST_SELECT}
             WHERE r.owner_id = ?
             ORDER BY r.created_at DESC`,
            [req.user.id]
        );
        const requests = rows.map(formatRequest);
        return res.json({ requests });
    } catch (error) {
        console.error('Error fetching received meeting requests:', error);
        return res.status(500).json({ error: 'Error fetching received meeting requests' });
    }
});

// update request status based on owner approval or rejection, only owner can update
router.patch('/meetings/requests/:requestId', authMiddleware, ownerOnly, async (req, res) => {
    const requestId = Number(req.params.requestId);
    const status = String(req.body.status || '').trim();
    const validStatuses = ['Approved', 'Rejected'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Use Approved or Rejected.' });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT owner_id FROM request WHERE id = ? LIMIT 1',
            [requestId],
        );
        const request = rows[0];

        if (!request) {
            return res.status(404).json({ error: 'Meeting request not found.' });
        }

        if (request.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to update this request.' });
        }

        await pool.execute(
            'UPDATE request SET status = ? WHERE id = ?',
            [status, requestId],
        );

        const [updatedRows] = await pool.execute(
            `${REQUEST_SELECT}
             WHERE r.id = ?
             LIMIT 1`,
            [requestId],
        );

        return res.json({ request: formatRequest(updatedRows[0]) });
    } catch (error) {
        console.error('Error updating meeting request:', error);
        return res.status(500).json({ error: 'Error updating meeting request' });
    }
});

// delete request by user
router.delete('/meetings/requests/:requestId', authMiddleware, async (req, res) => {
    const requestId = Number(req.params.requestId);

    try {
        const [rows] = await pool.execute(
            'SELECT requester_id AS requesterId, owner_id AS ownerId FROM request WHERE id = ? LIMIT 1',
            [requestId],
        );
        const request = rows[0];

        if (!request) {
            return res.status(404).json({ error: 'Meeting request not found.' });
        }

        if (req.user.id !== request.requesterId && req.user.id !== request.ownerId) {
            return res.status(403).json({ error: 'Not authorized to delete this request.' });
        }

        await pool.execute('DELETE FROM request WHERE id = ?', [requestId]);

        return res.json({ deletedRequestId: requestId });
    } catch (error) {
        console.error('Error deleting meeting request:', error);
        return res.status(500).json({ error: 'Error deleting meeting request' });
    }
});

module.exports = router;

