// /* Author: Hanjing Zheng */

// const express = require('express');
// const pool = require('../../db/db');
// const { authMiddleware, ownerOnly } = require('../middleware/auth');

// const router = express.Router();

// function toIsoString(value) {
//   if (value instanceof Date) {
//     return value.toISOString();
//   }

//   return new Date(value).toISOString();
// }

// function formatMeeting(row) {
//   return {
//     id: row.id,
//     title: row.title,
//     description: row.description || '',
//     status: row.status,
//     createdAt: toIsoString(row.createdAt),
//     owner: row.ownerUserId
//       ? {
//           id: row.ownerUserId,
//           name: row.ownerName,
//           email: row.ownerEmail,
//           role: row.ownerRole,
//         }
//       : null,
//   };
// }

// function formatMeetingSlot(row) {
//   return {
//     id: row.id,
//     meetingId: row.meetingId,
//     start: toIsoString(row.start),
//     end: toIsoString(row.end),
//   };
// }

// function formatInvitee(row) {
//   return {
//     id: row.userId,
//     name: row.userName,
//     email: row.userEmail,
//     role: row.userRole,
//   };
// }

// function formatVote(row) {
//   return {
//     id: row.id,
//     meetingId: row.meetingId,
//     slotId: row.slotId,
//     userId: row.userId,
//     isAvailable: Boolean(row.isAvailable),
//     createdAt: toIsoString(row.createdAt),
//   };
// }

// function isMcGillEmail(email = '') {
//   return /@(mail\.)?mcgill\.ca$/i.test(String(email).trim());
// }

// /* Type 2 helper user routes */

// router.get('/type2/me', authMiddleware, async (req, res) => {
//   try {
//     const [rows] = await pool.execute(
//       `
//       SELECT id, name, email, role
//       FROM users
//       WHERE id = ?
//       LIMIT 1
//       `,
//       [req.user.id]
//     );

//     const user = rows[0];

//     if (!user) {
//       return res.status(404).json({ error: 'Current user not found.' });
//     }

//     return res.json({
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error('Get Type 2 current user error:', error);
//     return res.status(500).json({ error: 'Unable to fetch current user.' });
//   }
// });

// router.get('/type2/users/:userId', authMiddleware, async (req, res) => {
//   try {
//     const userId = Number(req.params.userId);

//     if (!Number.isInteger(userId) || userId <= 0) {
//       return res.status(400).json({ error: 'Valid user ID is required.' });
//     }

//     const [rows] = await pool.execute(
//       `
//       SELECT id, name, email, role
//       FROM users
//       WHERE id = ?
//       LIMIT 1
//       `,
//       [userId]
//     );

//     const user = rows[0];

//     if (!user) {
//       return res.status(404).json({ error: 'User not found.' });
//     }

//     return res.json({
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error('Get Type 2 user by id error:', error);
//     return res.status(500).json({ error: 'Unable to fetch user.' });
//   }
// });

// router.get('/type2/owners/:ownerId', authMiddleware, async (req, res) => {
//   try {
//     const ownerId = Number(req.params.ownerId);

//     if (!Number.isInteger(ownerId) || ownerId <= 0) {
//       return res.status(400).json({ error: 'Valid owner ID is required.' });
//     }

//     const [rows] = await pool.execute(
//       `
//       SELECT id, name, email, role
//       FROM users
//       WHERE id = ? AND role = 'owner'
//       LIMIT 1
//       `,
//       [ownerId]
//     );

//     const owner = rows[0];

//     if (!owner) {
//       return res.status(404).json({ error: 'Owner not found.' });
//     }

//     return res.json({
//       owner: {
//         id: owner.id,
//         name: owner.name,
//         email: owner.email,
//         role: owner.role,
//       },
//     });
//   } catch (error) {
//     console.error('Get Type 2 owner by id error:', error);
//     return res.status(500).json({ error: 'Unable to fetch owner.' });
//   }
// });

// /* Type 2 meeting routes */

// router.post('/type2/meetings', authMiddleware, ownerOnly, async (req, res) => {
//   const title = String(req.body.title || '').trim();
//   const description = String(req.body.description || '').trim();
//   const slots = Array.isArray(req.body.slots) ? req.body.slots : [];
//   const inviteeIdsInput = Array.isArray(req.body.inviteeIds) ? req.body.inviteeIds : [];
//   const inviteeEmailsInput = Array.isArray(req.body.inviteeEmails) ? req.body.inviteeEmails : [];

//   if (!title) {
//     return res.status(400).json({ error: 'Meeting title is required.' });
//   }

//   if (!slots.length) {
//     return res.status(400).json({ error: 'At least one candidate slot is required.' });
//   }

//   for (const slot of slots) {
//     if (!slot?.start || !slot?.end) {
//       return res.status(400).json({ error: 'Each slot must include start and end time.' });
//     }

//     if (new Date(slot.start).getTime() >= new Date(slot.end).getTime()) {
//       return res.status(400).json({ error: 'Each slot must end after it starts.' });
//     }
//   }

//   const cleanedInviteeIds = [...new Set(
//     inviteeIdsInput.map((value) => Number(value)).filter(Boolean)
//   )];

//   const cleanedInviteeEmails = [...new Set(
//     inviteeEmailsInput
//       .map((value) => String(value || '').trim().toLowerCase())
//       .filter(Boolean)
//   )];

//   if (!cleanedInviteeIds.length && !cleanedInviteeEmails.length) {
//     return res.status(400).json({ error: 'At least one invitee is required.' });
//   }

//   for (const email of cleanedInviteeEmails) {
//     if (!isMcGillEmail(email)) {
//       return res.status(400).json({ error: `Invalid McGill email: ${email}` });
//     }
//   }

//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     let resolvedInviteeRows = [];

//     if (cleanedInviteeIds.length) {
//       const [inviteeRowsById] = await connection.execute(
//         `
//         SELECT id, name, email, role
//         FROM users
//         WHERE id IN (${cleanedInviteeIds.map(() => '?').join(', ')})
//         `,
//         cleanedInviteeIds,
//       );

//       if (inviteeRowsById.length !== cleanedInviteeIds.length) {
//         await connection.rollback();
//         return res.status(400).json({ error: 'One or more invitee IDs do not exist.' });
//       }

//       resolvedInviteeRows = [...inviteeRowsById];
//     }

//     if (cleanedInviteeEmails.length) {
//       const [inviteeRowsByEmail] = await connection.execute(
//         `
//         SELECT id, name, email, role
//         FROM users
//         WHERE LOWER(email) IN (${cleanedInviteeEmails.map(() => '?').join(', ')})
//         `,
//         cleanedInviteeEmails,
//       );

//       if (inviteeRowsByEmail.length !== cleanedInviteeEmails.length) {
//         const foundEmails = new Set(
//           inviteeRowsByEmail.map((row) => String(row.email).trim().toLowerCase())
//         );
//         const missingEmails = cleanedInviteeEmails.filter((email) => !foundEmails.has(email));

//         await connection.rollback();
//         return res.status(400).json({
//           error: `These invited users are not registered yet: ${missingEmails.join(', ')}`,
//         });
//       }

//       resolvedInviteeRows = [...resolvedInviteeRows, ...inviteeRowsByEmail];
//     }

//     const uniqueInvitees = [];
//     const seenUserIds = new Set();

//     for (const invitee of resolvedInviteeRows) {
//       const userId = Number(invitee.id);

//       if (userId === Number(req.user.id)) {
//         continue;
//       }

//       if (!seenUserIds.has(userId)) {
//         seenUserIds.add(userId);
//         uniqueInvitees.push(invitee);
//       }
//     }

//     if (!uniqueInvitees.length) {
//       await connection.rollback();
//       return res.status(400).json({ error: 'At least one valid invited user is required.' });
//     }

//     const [meetingResult] = await connection.execute(
//       `
//       INSERT INTO type2_meetings (owner_id, title, description, status)
//       VALUES (?, ?, ?, 'open')
//       `,
//       [req.user.id, title, description || null],
//     );

//     const meetingId = meetingResult.insertId;

//     for (const slot of slots) {
//       await connection.execute(
//         `
//         INSERT INTO type2_meeting_slots (meeting_id, start_time, end_time)
//         VALUES (?, ?, ?)
//         `,
//         [meetingId, new Date(slot.start), new Date(slot.end)],
//       );
//     }

//     for (const invitee of uniqueInvitees) {
//       await connection.execute(
//         `
//         INSERT INTO type2_meeting_invitees (meeting_id, user_id)
//         VALUES (?, ?)
//         `,
//         [meetingId, invitee.id],
//       );
//     }

//     await connection.commit();

//     return res.status(201).json({
//       meetingId,
//       message: 'Type 2 meeting created successfully.',
//       invitees: uniqueInvitees.map((invitee) => ({
//         id: invitee.id,
//         name: invitee.name,
//         email: invitee.email,
//         role: invitee.role,
//       })),
//     });
//   } catch (error) {
//     await connection.rollback();
//     console.error('Create Type 2 meeting error:', error);
//     return res.status(500).json({ error: 'Unable to create Type 2 meeting.' });
//   } finally {
//     connection.release();
//   }
// });

// router.get('/type2/owner/meetings', authMiddleware, ownerOnly, async (req, res) => {
//   try {
//     const [rows] = await pool.execute(
//       `
//       SELECT
//         m.id,
//         m.title,
//         m.description,
//         m.status,
//         m.created_at AS createdAt,
//         owner.id AS ownerUserId,
//         owner.name AS ownerName,
//         owner.email AS ownerEmail,
//         owner.role AS ownerRole
//       FROM type2_meetings m
//       JOIN users owner ON owner.id = m.owner_id
//       WHERE m.owner_id = ?
//       ORDER BY m.created_at DESC
//       `,
//       [req.user.id],
//     );

//     return res.json({ meetings: rows.map(formatMeeting) });
//   } catch (error) {
//     console.error('Get owner Type 2 meetings error:', error);
//     return res.status(500).json({ error: 'Unable to fetch owner Type 2 meetings.' });
//   }
// });

// router.get('/type2/me/invitations', authMiddleware, async (req, res) => {
//   try {
//     const [rows] = await pool.execute(
//       `
//       SELECT
//         m.id,
//         m.title,
//         m.description,
//         m.status,
//         m.created_at AS createdAt,
//         owner.id AS ownerUserId,
//         owner.name AS ownerName,
//         owner.email AS ownerEmail,
//         owner.role AS ownerRole
//       FROM type2_meeting_invitees i
//       JOIN type2_meetings m ON m.id = i.meeting_id
//       JOIN users owner ON owner.id = m.owner_id
//       WHERE i.user_id = ?
//       ORDER BY m.created_at DESC
//       `,
//       [req.user.id],
//     );

//     return res.json({ meetings: rows.map(formatMeeting) });
//   } catch (error) {
//     console.error('Get Type 2 invitations error:', error);
//     return res.status(500).json({ error: 'Unable to fetch Type 2 invitations.' });
//   }
// });

// router.get('/type2/meetings/:meetingId', authMiddleware, async (req, res) => {
//   const meetingId = Number(req.params.meetingId);

//   try {
//     const [meetingRows] = await pool.execute(
//       `
//       SELECT
//         m.id,
//         m.owner_id,
//         m.title,
//         m.description,
//         m.status,
//         m.created_at AS createdAt,
//         owner.id AS ownerUserId,
//         owner.name AS ownerName,
//         owner.email AS ownerEmail,
//         owner.role AS ownerRole
//       FROM type2_meetings m
//       JOIN users owner ON owner.id = m.owner_id
//       WHERE m.id = ?
//       LIMIT 1
//       `,
//       [meetingId],
//     );

//     const meetingRow = meetingRows[0];

//     if (!meetingRow) {
//       return res.status(404).json({ error: 'Type 2 meeting not found.' });
//     }

//     const isOwner = Number(meetingRow.owner_id) === Number(req.user.id);

//     if (!isOwner) {
//       const [inviteeCheckRows] = await pool.execute(
//         `
//         SELECT id
//         FROM type2_meeting_invitees
//         WHERE meeting_id = ? AND user_id = ?
//         LIMIT 1
//         `,
//         [meetingId, req.user.id],
//       );

//       if (!inviteeCheckRows[0]) {
//         return res.status(403).json({ error: 'Not authorized to view this Type 2 meeting.' });
//       }
//     }

//     const [slotRows] = await pool.execute(
//       `
//       SELECT
//         s.id,
//         s.meeting_id AS meetingId,
//         s.start_time AS start,
//         s.end_time AS end
//       FROM type2_meeting_slots s
//       WHERE s.meeting_id = ?
//       ORDER BY s.start_time ASC
//       `,
//       [meetingId],
//     );

//     const [inviteeRows] = await pool.execute(
//       `
//       SELECT
//         i.user_id AS userId,
//         u.name AS userName,
//         u.email AS userEmail,
//         u.role AS userRole
//       FROM type2_meeting_invitees i
//       JOIN users u ON u.id = i.user_id
//       WHERE i.meeting_id = ?
//       ORDER BY u.name ASC
//       `,
//       [meetingId],
//     );

//     return res.json({
//       meeting: formatMeeting(meetingRow),
//       slots: slotRows.map(formatMeetingSlot),
//       invitees: inviteeRows.map(formatInvitee),
//     });
//   } catch (error) {
//     console.error('Get Type 2 meeting detail error:', error);
//     return res.status(500).json({ error: 'Unable to fetch Type 2 meeting.' });
//   }
// });

// router.get('/type2/meetings/:meetingId/my-votes', authMiddleware, async (req, res) => {
//   const meetingId = Number(req.params.meetingId);

//   try {
//     const [inviteeCheckRows] = await pool.execute(
//       `
//       SELECT id
//       FROM type2_meeting_invitees
//       WHERE meeting_id = ? AND user_id = ?
//       LIMIT 1
//       `,
//       [meetingId, req.user.id],
//     );

//     if (!inviteeCheckRows[0]) {
//       return res.status(403).json({ error: 'Not authorized to view votes for this meeting.' });
//     }

//     const [rows] = await pool.execute(
//       `
//       SELECT
//         v.id,
//         v.meeting_id AS meetingId,
//         v.slot_id AS slotId,
//         v.user_id AS userId,
//         v.is_available AS isAvailable,
//         v.created_at AS createdAt
//       FROM type2_meeting_votes v
//       WHERE v.meeting_id = ? AND v.user_id = ?
//       ORDER BY v.slot_id ASC
//       `,
//       [meetingId, req.user.id],
//     );

//     return res.json({ votes: rows.map(formatVote) });
//   } catch (error) {
//     console.error('Get Type 2 my votes error:', error);
//     return res.status(500).json({ error: 'Unable to fetch Type 2 votes.' });
//   }
// });

// router.post('/type2/meetings/:meetingId/votes', authMiddleware, async (req, res) => {
//   const meetingId = Number(req.params.meetingId);
//   const votes = Array.isArray(req.body.votes) ? req.body.votes : [];

//   if (!votes.length) {
//     return res.status(400).json({ error: 'At least one vote is required.' });
//   }

//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     const [meetingRows] = await connection.execute(
//       `
//       SELECT id, owner_id, status
//       FROM type2_meetings
//       WHERE id = ?
//       LIMIT 1
//       `,
//       [meetingId],
//     );

//     const meeting = meetingRows[0];

//     if (!meeting) {
//       await connection.rollback();
//       return res.status(404).json({ error: 'Type 2 meeting not found.' });
//     }

//     if (meeting.status !== 'open') {
//       await connection.rollback();
//       return res.status(400).json({ error: 'Voting is closed for this meeting.' });
//     }

//     const [inviteeCheckRows] = await connection.execute(
//       `
//       SELECT id
//       FROM type2_meeting_invitees
//       WHERE meeting_id = ? AND user_id = ?
//       LIMIT 1
//       `,
//       [meetingId, req.user.id],
//     );

//     if (!inviteeCheckRows[0]) {
//       await connection.rollback();
//       return res.status(403).json({ error: 'You are not invited to this meeting.' });
//     }

//     const slotIds = [...new Set(votes.map((vote) => Number(vote.slotId)).filter(Boolean))];

//     if (!slotIds.length) {
//       await connection.rollback();
//       return res.status(400).json({ error: 'Votes must contain valid slot IDs.' });
//     }

//     const [slotRows] = await connection.execute(
//       `
//       SELECT id
//       FROM type2_meeting_slots
//       WHERE meeting_id = ? AND id IN (${slotIds.map(() => '?').join(', ')})
//       `,
//       [meetingId, ...slotIds],
//     );

//     if (slotRows.length !== slotIds.length) {
//       await connection.rollback();
//       return res.status(400).json({ error: 'One or more selected slots do not belong to this meeting.' });
//     }

//     for (const vote of votes) {
//       await connection.execute(
//         `
//         INSERT INTO type2_meeting_votes (meeting_id, slot_id, user_id, is_available)
//         VALUES (?, ?, ?, ?)
//         ON DUPLICATE KEY UPDATE
//           is_available = VALUES(is_available),
//           created_at = CURRENT_TIMESTAMP
//         `,
//         [
//           meetingId,
//           Number(vote.slotId),
//           req.user.id,
//           vote.isAvailable ? 1 : 0,
//         ],
//       );
//     }

//     await connection.commit();

//     const [updatedVoteRows] = await pool.execute(
//       `
//       SELECT
//         v.id,
//         v.meeting_id AS meetingId,
//         v.slot_id AS slotId,
//         v.user_id AS userId,
//         v.is_available AS isAvailable,
//         v.created_at AS createdAt
//       FROM type2_meeting_votes v
//       WHERE v.meeting_id = ? AND v.user_id = ?
//       ORDER BY v.slot_id ASC
//       `,
//       [meetingId, req.user.id],
//     );

//     return res.json({
//       message: 'Votes submitted successfully.',
//       votes: updatedVoteRows.map(formatVote),
//     });
//   } catch (error) {
//     await connection.rollback();
//     console.error('Submit Type 2 votes error:', error);
//     return res.status(500).json({ error: 'Unable to submit Type 2 votes.' });
//   } finally {
//     connection.release();
//   }
// });

// router.get('/type2/meetings/:meetingId/results', authMiddleware, async (req, res) => {
//   const meetingId = Number(req.params.meetingId);

//   try {
//     const [meetingRows] = await pool.execute(
//       `
//       SELECT
//         m.id,
//         m.owner_id,
//         m.title,
//         m.description,
//         m.status,
//         m.created_at AS createdAt,
//         owner.id AS ownerUserId,
//         owner.name AS ownerName,
//         owner.email AS ownerEmail,
//         owner.role AS ownerRole
//       FROM type2_meetings m
//       JOIN users owner ON owner.id = m.owner_id
//       WHERE m.id = ?
//       LIMIT 1
//       `,
//       [meetingId],
//     );

//     const meetingRow = meetingRows[0];

//     if (!meetingRow) {
//       return res.status(404).json({ error: 'Type 2 meeting not found.' });
//     }

//     const isOwner = Number(meetingRow.owner_id) === Number(req.user.id);

//     if (!isOwner) {
//       const [inviteeCheckRows] = await pool.execute(
//         `
//         SELECT id
//         FROM type2_meeting_invitees
//         WHERE meeting_id = ? AND user_id = ?
//         LIMIT 1
//         `,
//         [meetingId, req.user.id],
//       );

//       if (!inviteeCheckRows[0]) {
//         return res.status(403).json({ error: 'Not authorized to view Type 2 results.' });
//       }
//     }

//     const [slotRows] = await pool.execute(
//       `
//       SELECT
//         s.id,
//         s.meeting_id AS meetingId,
//         s.start_time AS start,
//         s.end_time AS end,
//         COUNT(CASE WHEN v.is_available = 1 THEN 1 END) AS availableCount
//       FROM type2_meeting_slots s
//       LEFT JOIN type2_meeting_votes v ON v.slot_id = s.id
//       WHERE s.meeting_id = ?
//       GROUP BY s.id, s.meeting_id, s.start_time, s.end_time
//       ORDER BY availableCount DESC, s.start_time ASC
//       `,
//       [meetingId],
//     );

//     const [voteDetailRows] = await pool.execute(
//       `
//       SELECT
//         v.slot_id AS slotId,
//         v.user_id AS userId,
//         v.is_available AS isAvailable,
//         u.name,
//         u.email
//       FROM type2_meeting_votes v
//       JOIN users u ON u.id = v.user_id
//       WHERE v.meeting_id = ?
//       ORDER BY v.slot_id, u.name
//       `,
//       [meetingId],
//     );

//     return res.json({
//       meeting: formatMeeting(meetingRow),
//       results: slotRows.map((row) => ({
//         slot: {
//           id: row.id,
//           meetingId: row.meetingId,
//           start: toIsoString(row.start),
//           end: toIsoString(row.end),
//         },
//         availableCount: Number(row.availableCount || 0),
//       })),
//       voteDetails: voteDetailRows.map((row) => ({
//         slotId: row.slotId,
//         userId: row.userId,
//         name: row.name,
//         email: row.email,
//         isAvailable: Boolean(row.isAvailable),
//       })),
//     });
//   } catch (error) {
//     console.error('Get Type 2 results error:', error);
//     return res.status(500).json({ error: 'Unable to fetch Type 2 results.' });
//   }
// });

// router.patch('/type2/meetings/:meetingId/status', authMiddleware, ownerOnly, async (req, res) => {
//   const meetingId = Number(req.params.meetingId);
//   const status = String(req.body.status || '').trim().toLowerCase();

//   if (!['open', 'closed'].includes(status)) {
//     return res.status(400).json({ error: 'Status must be open or closed.' });
//   }

//   try {
//     const [updateResult] = await pool.execute(
//       `
//       UPDATE type2_meetings
//       SET status = ?
//       WHERE id = ? AND owner_id = ?
//       `,
//       [status, meetingId, req.user.id],
//     );

//     if (!updateResult.affectedRows) {
//       return res.status(404).json({ error: 'Type 2 meeting not found.' });
//     }

//     const [rows] = await pool.execute(
//       `
//       SELECT
//         m.id,
//         m.title,
//         m.description,
//         m.status,
//         m.created_at AS createdAt,
//         owner.id AS ownerUserId,
//         owner.name AS ownerName,
//         owner.email AS ownerEmail,
//         owner.role AS ownerRole
//       FROM type2_meetings m
//       JOIN users owner ON owner.id = m.owner_id
//       WHERE m.id = ?
//       LIMIT 1
//       `,
//       [meetingId],
//     );

//     return res.json({ meeting: formatMeeting(rows[0]) });
//   } catch (error) {
//     console.error('Update Type 2 meeting status error:', error);
//     return res.status(500).json({ error: 'Unable to update Type 2 meeting status.' });
//   }
// });

// router.delete('/type2/meetings/:meetingId', authMiddleware, ownerOnly, async (req, res) => {
//   const meetingId = Number(req.params.meetingId);

//   try {
//     const [rows] = await pool.execute(
//       `
//       SELECT id
//       FROM type2_meetings
//       WHERE id = ? AND owner_id = ?
//       LIMIT 1
//       `,
//       [meetingId, req.user.id],
//     );

//     if (!rows[0]) {
//       return res.status(404).json({ error: 'Type 2 meeting not found.' });
//     }

//     await pool.execute(
//       `DELETE FROM type2_meetings WHERE id = ? AND owner_id = ?`,
//       [meetingId, req.user.id],
//     );

//     return res.json({
//       deletedMeetingId: meetingId,
//       message: 'Type 2 meeting deleted successfully.',
//     });
//   } catch (error) {
//     console.error('Delete Type 2 meeting error:', error);
//     return res.status(500).json({ error: 'Unable to delete Type 2 meeting.' });
//   }
// });

// router.post('/type2/meetings/:meetingId/invitees', authMiddleware, ownerOnly, async (req, res) => {
//   const meetingId = Number(req.params.meetingId);
//   const email = String(req.body.email || '').trim().toLowerCase();

//   if (!email) {
//     return res.status(400).json({ error: 'Invitee email is required.' });
//   }

//   if (!isMcGillEmail(email)) {
//     return res.status(400).json({ error: `Invalid McGill email: ${email}` });
//   }

//   try {
//     const [meetingRows] = await pool.execute(
//       `
//       SELECT id
//       FROM type2_meetings
//       WHERE id = ? AND owner_id = ?
//       LIMIT 1
//       `,
//       [meetingId, req.user.id],
//     );

//     if (!meetingRows[0]) {
//       return res.status(404).json({ error: 'Type 2 meeting not found.' });
//     }

//     const [userRows] = await pool.execute(
//       `
//       SELECT id, name, email, role
//       FROM users
//       WHERE LOWER(email) = ?
//       LIMIT 1
//       `,
//       [email],
//     );

//     const invitee = userRows[0];

//     if (!invitee) {
//       return res.status(400).json({ error: `This invited user is not registered yet: ${email}` });
//     }

//     if (Number(invitee.id) === Number(req.user.id)) {
//       return res.status(400).json({ error: 'Owner cannot invite themselves.' });
//     }

//     await pool.execute(
//       `
//       INSERT INTO type2_meeting_invitees (meeting_id, user_id)
//       VALUES (?, ?)
//       `,
//       [meetingId, invitee.id],
//     );

//     return res.status(201).json({
//       invitee: {
//         id: invitee.id,
//         name: invitee.name,
//         email: invitee.email,
//         role: invitee.role,
//       },
//       message: 'Invitee added successfully.',
//     });
//   } catch (error) {
//     if (error.code === 'ER_DUP_ENTRY') {
//       return res.status(409).json({ error: 'That user is already invited.' });
//     }

//     console.error('Add Type 2 invitee error:', error);
//     return res.status(500).json({ error: 'Unable to add invitee.' });
//   }
// });

// router.delete('/type2/meetings/:meetingId/invitees/:userId', authMiddleware, ownerOnly, async (req, res) => {
//   const meetingId = Number(req.params.meetingId);
//   const userId = Number(req.params.userId);

//   try {
//     const [meetingRows] = await pool.execute(
//       `
//       SELECT id
//       FROM type2_meetings
//       WHERE id = ? AND owner_id = ?
//       LIMIT 1
//       `,
//       [meetingId, req.user.id],
//     );

//     if (!meetingRows[0]) {
//       return res.status(404).json({ error: 'Type 2 meeting not found.' });
//     }

//     const [deleteResult] = await pool.execute(
//       `
//       DELETE FROM type2_meeting_invitees
//       WHERE meeting_id = ? AND user_id = ?
//       `,
//       [meetingId, userId],
//     );

//     if (!deleteResult.affectedRows) {
//       return res.status(404).json({ error: 'Invitee not found.' });
//     }

//     await pool.execute(
//       `
//       DELETE FROM type2_meeting_votes
//       WHERE meeting_id = ? AND user_id = ?
//       `,
//       [meetingId, userId],
//     );

//     return res.json({
//       deletedUserId: userId,
//       message: 'Invitee removed successfully.',
//     });
//   } catch (error) {
//     console.error('Remove Type 2 invitee error:', error);
//     return res.status(500).json({ error: 'Unable to remove invitee.' });
//   }
// });

// router.post('/type2/meetings/:meetingId/slots', authMiddleware, ownerOnly, async (req, res) => {
//   const meetingId = Number(req.params.meetingId);
//   const start = String(req.body.start || '').trim();
//   const end = String(req.body.end || '').trim();

//   if (!start || !end) {
//     return res.status(400).json({ error: 'Start and end time are required.' });
//   }

//   if (new Date(start).getTime() >= new Date(end).getTime()) {
//     return res.status(400).json({ error: 'End time must be after start time.' });
//   }

//   try {
//     const [meetingRows] = await pool.execute(
//       `
//       SELECT id
//       FROM type2_meetings
//       WHERE id = ? AND owner_id = ?
//       LIMIT 1
//       `,
//       [meetingId, req.user.id],
//     );

//     if (!meetingRows[0]) {
//       return res.status(404).json({ error: 'Type 2 meeting not found.' });
//     }

//     const [result] = await pool.execute(
//       `
//       INSERT INTO type2_meeting_slots (meeting_id, start_time, end_time)
//       VALUES (?, ?, ?)
//       `,
//       [meetingId, new Date(start), new Date(end)],
//     );

//     const [rows] = await pool.execute(
//       `
//       SELECT
//         s.id,
//         s.meeting_id AS meetingId,
//         s.start_time AS start,
//         s.end_time AS end
//       FROM type2_meeting_slots s
//       WHERE s.id = ?
//       LIMIT 1
//       `,
//       [result.insertId],
//     );

//     return res.status(201).json({
//       slot: formatMeetingSlot(rows[0]),
//       message: 'Candidate slot added successfully.',
//     });
//   } catch (error) {
//     console.error('Add Type 2 slot error:', error);
//     return res.status(500).json({ error: 'Unable to add candidate slot.' });
//   }
// });

// router.delete('/type2/meetings/:meetingId/slots/:slotId', authMiddleware, ownerOnly, async (req, res) => {
//   const meetingId = Number(req.params.meetingId);
//   const slotId = Number(req.params.slotId);

//   try {
//     const [meetingRows] = await pool.execute(
//       `
//       SELECT id
//       FROM type2_meetings
//       WHERE id = ? AND owner_id = ?
//       LIMIT 1
//       `,
//       [meetingId, req.user.id],
//     );

//     if (!meetingRows[0]) {
//       return res.status(404).json({ error: 'Type 2 meeting not found.' });
//     }

//     const [deleteResult] = await pool.execute(
//       `
//       DELETE FROM type2_meeting_slots
//       WHERE id = ? AND meeting_id = ?
//       `,
//       [slotId, meetingId],
//     );

//     if (!deleteResult.affectedRows) {
//       return res.status(404).json({ error: 'Candidate slot not found.' });
//     }

//     return res.json({
//       deletedSlotId: slotId,
//       message: 'Candidate slot removed successfully.',
//     });
//   } catch (error) {
//     console.error('Remove Type 2 slot error:', error);
//     return res.status(500).json({ error: 'Unable to remove candidate slot.' });
//   }
// });

// module.exports = router;




/* Author: Hanjing Zheng */

const express = require('express');
const pool = require('../../db/db');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

const router = express.Router();

function toIsoString(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function formatMeeting(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    status: row.status,
    createdAt: toIsoString(row.createdAt),
    finalSlotId: row.finalSlotId ?? row.final_slot_id ?? null,
    owner: row.ownerUserId
      ? {
          id: row.ownerUserId,
          name: row.ownerName,
          email: row.ownerEmail,
          role: row.ownerRole,
        }
      : null,
  };
}

function formatMeetingSlot(row) {
  return {
    id: row.id,
    meetingId: row.meetingId,
    start: toIsoString(row.start),
    end: toIsoString(row.end),
  };
}

function formatInvitee(row) {
  return {
    id: row.userId,
    name: row.userName,
    email: row.userEmail,
    role: row.userRole,
  };
}

function formatVote(row) {
  return {
    id: row.id,
    meetingId: row.meetingId,
    slotId: row.slotId,
    userId: row.userId,
    isAvailable: Boolean(row.isAvailable),
    createdAt: toIsoString(row.createdAt),
  };
}

function isMcGillEmail(email = '') {
  return /@(mail\.)?mcgill\.ca$/i.test(String(email).trim());
}

/* Type 2 helper user routes */

router.get('/type2/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT id, name, email, role
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [req.user.id]
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Current user not found.' });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get Type 2 current user error:', error);
    return res.status(500).json({ error: 'Unable to fetch current user.' });
  }
});

router.get('/type2/users/:userId', authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Valid user ID is required.' });
    }

    const [rows] = await pool.execute(
      `
      SELECT id, name, email, role
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get Type 2 user by id error:', error);
    return res.status(500).json({ error: 'Unable to fetch user.' });
  }
});

router.get('/type2/owners/:ownerId', authMiddleware, async (req, res) => {
  try {
    const ownerId = Number(req.params.ownerId);

    if (!Number.isInteger(ownerId) || ownerId <= 0) {
      return res.status(400).json({ error: 'Valid owner ID is required.' });
    }

    const [rows] = await pool.execute(
      `
      SELECT id, name, email, role
      FROM users
      WHERE id = ? AND role = 'owner'
      LIMIT 1
      `,
      [ownerId]
    );

    const owner = rows[0];

    if (!owner) {
      return res.status(404).json({ error: 'Owner not found.' });
    }

    return res.json({
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
      },
    });
  } catch (error) {
    console.error('Get Type 2 owner by id error:', error);
    return res.status(500).json({ error: 'Unable to fetch owner.' });
  }
});

/* Type 2 meeting routes */

router.post('/type2/meetings', authMiddleware, ownerOnly, async (req, res) => {
  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  const slots = Array.isArray(req.body.slots) ? req.body.slots : [];
  const inviteeIdsInput = Array.isArray(req.body.inviteeIds) ? req.body.inviteeIds : [];
  const inviteeEmailsInput = Array.isArray(req.body.inviteeEmails) ? req.body.inviteeEmails : [];

  if (!title) {
    return res.status(400).json({ error: 'Meeting title is required.' });
  }

  if (!slots.length) {
    return res.status(400).json({ error: 'At least one candidate slot is required.' });
  }

  for (const slot of slots) {
    if (!slot?.start || !slot?.end) {
      return res.status(400).json({ error: 'Each slot must include start and end time.' });
    }

    if (new Date(slot.start).getTime() >= new Date(slot.end).getTime()) {
      return res.status(400).json({ error: 'Each slot must end after it starts.' });
    }
  }

  const cleanedInviteeIds = [...new Set(
    inviteeIdsInput.map((value) => Number(value)).filter(Boolean)
  )];

  const cleanedInviteeEmails = [...new Set(
    inviteeEmailsInput
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean)
  )];

  if (!cleanedInviteeIds.length && !cleanedInviteeEmails.length) {
    return res.status(400).json({ error: 'At least one invitee is required.' });
  }

  for (const email of cleanedInviteeEmails) {
    if (!isMcGillEmail(email)) {
      return res.status(400).json({ error: `Invalid McGill email: ${email}` });
    }
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let resolvedInviteeRows = [];

    if (cleanedInviteeIds.length) {
      const [inviteeRowsById] = await connection.execute(
        `
        SELECT id, name, email, role
        FROM users
        WHERE id IN (${cleanedInviteeIds.map(() => '?').join(', ')})
        `,
        cleanedInviteeIds
      );

      if (inviteeRowsById.length !== cleanedInviteeIds.length) {
        await connection.rollback();
        return res.status(400).json({ error: 'One or more invitee IDs do not exist.' });
      }

      resolvedInviteeRows = [...inviteeRowsById];
    }

    if (cleanedInviteeEmails.length) {
      const [inviteeRowsByEmail] = await connection.execute(
        `
        SELECT id, name, email, role
        FROM users
        WHERE LOWER(email) IN (${cleanedInviteeEmails.map(() => '?').join(', ')})
        `,
        cleanedInviteeEmails
      );

      if (inviteeRowsByEmail.length !== cleanedInviteeEmails.length) {
        const foundEmails = new Set(
          inviteeRowsByEmail.map((row) => String(row.email).trim().toLowerCase())
        );
        const missingEmails = cleanedInviteeEmails.filter((email) => !foundEmails.has(email));

        await connection.rollback();
        return res.status(400).json({
          error: `These invited users are not registered yet: ${missingEmails.join(', ')}`,
        });
      }

      resolvedInviteeRows = [...resolvedInviteeRows, ...inviteeRowsByEmail];
    }

    const uniqueInvitees = [];
    const seenUserIds = new Set();

    for (const invitee of resolvedInviteeRows) {
      const userId = Number(invitee.id);

      if (userId === Number(req.user.id)) {
        continue;
      }

      if (!seenUserIds.has(userId)) {
        seenUserIds.add(userId);
        uniqueInvitees.push(invitee);
      }
    }

    if (!uniqueInvitees.length) {
      await connection.rollback();
      return res.status(400).json({ error: 'At least one valid invited user is required.' });
    }

    const [meetingResult] = await connection.execute(
      `
      INSERT INTO type2_meetings (owner_id, title, description, status, final_slot_id)
      VALUES (?, ?, ?, 'open', NULL)
      `,
      [req.user.id, title, description || null]
    );

    const meetingId = meetingResult.insertId;

    for (const slot of slots) {
      await connection.execute(
        `
        INSERT INTO type2_meeting_slots (meeting_id, start_time, end_time)
        VALUES (?, ?, ?)
        `,
        [meetingId, new Date(slot.start), new Date(slot.end)]
      );
    }

    for (const invitee of uniqueInvitees) {
      await connection.execute(
        `
        INSERT INTO type2_meeting_invitees (meeting_id, user_id)
        VALUES (?, ?)
        `,
        [meetingId, invitee.id]
      );
    }

    await connection.commit();

    return res.status(201).json({
      meetingId,
      message: 'Type 2 meeting created successfully.',
      invitees: uniqueInvitees.map((invitee) => ({
        id: invitee.id,
        name: invitee.name,
        email: invitee.email,
        role: invitee.role,
      })),
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create Type 2 meeting error:', error);
    return res.status(500).json({ error: 'Unable to create Type 2 meeting.' });
  } finally {
    connection.release();
  }
});

router.get('/type2/owner/meetings', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        m.id,
        m.title,
        m.description,
        m.status,
        m.final_slot_id AS finalSlotId,
        m.created_at AS createdAt,
        owner.id AS ownerUserId,
        owner.name AS ownerName,
        owner.email AS ownerEmail,
        owner.role AS ownerRole
      FROM type2_meetings m
      JOIN users owner ON owner.id = m.owner_id
      WHERE m.owner_id = ?
      ORDER BY m.created_at DESC
      `,
      [req.user.id]
    );

    return res.json({ meetings: rows.map(formatMeeting) });
  } catch (error) {
    console.error('Get owner Type 2 meetings error:', error);
    return res.status(500).json({ error: 'Unable to fetch owner Type 2 meetings.' });
  }
});

router.get('/type2/owner/finalized-meetings', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        m.id,
        m.title,
        m.description,
        m.status,
        m.created_at AS createdAt,
        m.final_slot_id AS finalSlotId,
        owner.id AS ownerUserId,
        owner.name AS ownerName,
        owner.email AS ownerEmail,
        owner.role AS ownerRole,
        s.id AS slotId,
        s.start_time AS slotStart,
        s.end_time AS slotEnd
      FROM type2_meetings m
      JOIN users owner ON owner.id = m.owner_id
      JOIN type2_meeting_slots s ON s.id = m.final_slot_id
      WHERE m.owner_id = ?
        AND m.final_slot_id IS NOT NULL
      ORDER BY s.start_time ASC
      `,
      [req.user.id]
    );

    return res.json({
      meetings: rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        status: row.status,
        createdAt: toIsoString(row.createdAt),
        finalSlotId: row.finalSlotId,
        owner: {
          id: row.ownerUserId,
          name: row.ownerName,
          email: row.ownerEmail,
          role: row.ownerRole,
        },
        finalSlot: {
          id: row.slotId,
          start: toIsoString(row.slotStart),
          end: toIsoString(row.slotEnd),
        },
      })),
    });
  } catch (error) {
    console.error('Get Type 2 finalized meetings for owner error:', error);
    return res.status(500).json({ error: 'Unable to fetch finalized meetings.' });
  }
});

router.get('/type2/me/invitations', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        m.id,
        m.title,
        m.description,
        m.status,
        m.final_slot_id AS finalSlotId,
        m.created_at AS createdAt,
        owner.id AS ownerUserId,
        owner.name AS ownerName,
        owner.email AS ownerEmail,
        owner.role AS ownerRole
      FROM type2_meeting_invitees i
      JOIN type2_meetings m ON m.id = i.meeting_id
      JOIN users owner ON owner.id = m.owner_id
      WHERE i.user_id = ?
      ORDER BY m.created_at DESC
      `,
      [req.user.id]
    );

    return res.json({ meetings: rows.map(formatMeeting) });
  } catch (error) {
    console.error('Get Type 2 invitations error:', error);
    return res.status(500).json({ error: 'Unable to fetch Type 2 invitations.' });
  }
});

router.get('/type2/me/finalized-meetings', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        m.id,
        m.title,
        m.description,
        m.status,
        m.created_at AS createdAt,
        m.final_slot_id AS finalSlotId,
        owner.id AS ownerUserId,
        owner.name AS ownerName,
        owner.email AS ownerEmail,
        owner.role AS ownerRole,
        s.id AS slotId,
        s.start_time AS slotStart,
        s.end_time AS slotEnd
      FROM type2_meeting_invitees i
      JOIN type2_meetings m ON m.id = i.meeting_id
      JOIN users owner ON owner.id = m.owner_id
      JOIN type2_meeting_slots s ON s.id = m.final_slot_id
      WHERE i.user_id = ?
        AND m.final_slot_id IS NOT NULL
      ORDER BY s.start_time ASC
      `,
      [req.user.id]
    );

    return res.json({
      meetings: rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        status: row.status,
        createdAt: toIsoString(row.createdAt),
        finalSlotId: row.finalSlotId,
        owner: {
          id: row.ownerUserId,
          name: row.ownerName,
          email: row.ownerEmail,
          role: row.ownerRole,
        },
        finalSlot: {
          id: row.slotId,
          start: toIsoString(row.slotStart),
          end: toIsoString(row.slotEnd),
        },
      })),
    });
  } catch (error) {
    console.error('Get Type 2 finalized meetings for user error:', error);
    return res.status(500).json({ error: 'Unable to fetch finalized meetings.' });
  }
});

router.get('/type2/meetings/:meetingId', authMiddleware, async (req, res) => {
  const meetingId = Number(req.params.meetingId);

  try {
    const [meetingRows] = await pool.execute(
      `
      SELECT
        m.id,
        m.owner_id,
        m.title,
        m.description,
        m.status,
        m.final_slot_id AS finalSlotId,
        m.created_at AS createdAt,
        owner.id AS ownerUserId,
        owner.name AS ownerName,
        owner.email AS ownerEmail,
        owner.role AS ownerRole
      FROM type2_meetings m
      JOIN users owner ON owner.id = m.owner_id
      WHERE m.id = ?
      LIMIT 1
      `,
      [meetingId]
    );

    const meetingRow = meetingRows[0];

    if (!meetingRow) {
      return res.status(404).json({ error: 'Type 2 meeting not found.' });
    }

    const isOwner = Number(meetingRow.owner_id) === Number(req.user.id);

    if (!isOwner) {
      const [inviteeCheckRows] = await pool.execute(
        `
        SELECT id
        FROM type2_meeting_invitees
        WHERE meeting_id = ? AND user_id = ?
        LIMIT 1
        `,
        [meetingId, req.user.id]
      );

      if (!inviteeCheckRows[0]) {
        return res.status(403).json({ error: 'Not authorized to view this Type 2 meeting.' });
      }
    }

    const [slotRows] = await pool.execute(
      `
      SELECT
        s.id,
        s.meeting_id AS meetingId,
        s.start_time AS start,
        s.end_time AS end
      FROM type2_meeting_slots s
      WHERE s.meeting_id = ?
      ORDER BY s.start_time ASC
      `,
      [meetingId]
    );

    const [inviteeRows] = await pool.execute(
      `
      SELECT
        i.user_id AS userId,
        u.name AS userName,
        u.email AS userEmail,
        u.role AS userRole
      FROM type2_meeting_invitees i
      JOIN users u ON u.id = i.user_id
      WHERE i.meeting_id = ?
      ORDER BY u.name ASC
      `,
      [meetingId]
    );

    let finalSlot = null;

    if (meetingRow.finalSlotId) {
      const [finalSlotRows] = await pool.execute(
        `
        SELECT
          s.id,
          s.meeting_id AS meetingId,
          s.start_time AS start,
          s.end_time AS end
        FROM type2_meeting_slots s
        WHERE s.id = ? AND s.meeting_id = ?
        LIMIT 1
        `,
        [meetingRow.finalSlotId, meetingId]
      );

      if (finalSlotRows[0]) {
        finalSlot = formatMeetingSlot(finalSlotRows[0]);
      }
    }

    return res.json({
      meeting: formatMeeting(meetingRow),
      slots: slotRows.map(formatMeetingSlot),
      invitees: inviteeRows.map(formatInvitee),
      finalSlot,
    });
  } catch (error) {
    console.error('Get Type 2 meeting detail error:', error);
    return res.status(500).json({ error: 'Unable to fetch Type 2 meeting.' });
  }
});

router.get('/type2/meetings/:meetingId/my-votes', authMiddleware, async (req, res) => {
  const meetingId = Number(req.params.meetingId);

  try {
    const [inviteeCheckRows] = await pool.execute(
      `
      SELECT id
      FROM type2_meeting_invitees
      WHERE meeting_id = ? AND user_id = ?
      LIMIT 1
      `,
      [meetingId, req.user.id]
    );

    if (!inviteeCheckRows[0]) {
      return res.status(403).json({ error: 'Not authorized to view votes for this meeting.' });
    }

    const [rows] = await pool.execute(
      `
      SELECT
        v.id,
        v.meeting_id AS meetingId,
        v.slot_id AS slotId,
        v.user_id AS userId,
        v.is_available AS isAvailable,
        v.created_at AS createdAt
      FROM type2_meeting_votes v
      WHERE v.meeting_id = ? AND v.user_id = ?
      ORDER BY v.slot_id ASC
      `,
      [meetingId, req.user.id]
    );

    return res.json({ votes: rows.map(formatVote) });
  } catch (error) {
    console.error('Get Type 2 my votes error:', error);
    return res.status(500).json({ error: 'Unable to fetch Type 2 votes.' });
  }
});

router.post('/type2/meetings/:meetingId/votes', authMiddleware, async (req, res) => {
  const meetingId = Number(req.params.meetingId);
  const votes = Array.isArray(req.body.votes) ? req.body.votes : [];

  if (!votes.length) {
    return res.status(400).json({ error: 'At least one vote is required.' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [meetingRows] = await connection.execute(
      `
      SELECT id, owner_id, status
      FROM type2_meetings
      WHERE id = ?
      LIMIT 1
      `,
      [meetingId]
    );

    const meeting = meetingRows[0];

    if (!meeting) {
      await connection.rollback();
      return res.status(404).json({ error: 'Type 2 meeting not found.' });
    }

    if (meeting.status !== 'open') {
      await connection.rollback();
      return res.status(400).json({ error: 'Voting is closed for this meeting.' });
    }

    const [inviteeCheckRows] = await connection.execute(
      `
      SELECT id
      FROM type2_meeting_invitees
      WHERE meeting_id = ? AND user_id = ?
      LIMIT 1
      `,
      [meetingId, req.user.id]
    );

    if (!inviteeCheckRows[0]) {
      await connection.rollback();
      return res.status(403).json({ error: 'You are not invited to this meeting.' });
    }

    const slotIds = [...new Set(votes.map((vote) => Number(vote.slotId)).filter(Boolean))];

    if (!slotIds.length) {
      await connection.rollback();
      return res.status(400).json({ error: 'Votes must contain valid slot IDs.' });
    }

    const [slotRows] = await connection.execute(
      `
      SELECT id
      FROM type2_meeting_slots
      WHERE meeting_id = ? AND id IN (${slotIds.map(() => '?').join(', ')})
      `,
      [meetingId, ...slotIds]
    );

    if (slotRows.length !== slotIds.length) {
      await connection.rollback();
      return res.status(400).json({ error: 'One or more selected slots do not belong to this meeting.' });
    }

    for (const vote of votes) {
      await connection.execute(
        `
        INSERT INTO type2_meeting_votes (meeting_id, slot_id, user_id, is_available)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          is_available = VALUES(is_available),
          created_at = CURRENT_TIMESTAMP
        `,
        [
          meetingId,
          Number(vote.slotId),
          req.user.id,
          vote.isAvailable ? 1 : 0,
        ]
      );
    }

    await connection.commit();

    const [updatedVoteRows] = await pool.execute(
      `
      SELECT
        v.id,
        v.meeting_id AS meetingId,
        v.slot_id AS slotId,
        v.user_id AS userId,
        v.is_available AS isAvailable,
        v.created_at AS createdAt
      FROM type2_meeting_votes v
      WHERE v.meeting_id = ? AND v.user_id = ?
      ORDER BY v.slot_id ASC
      `,
      [meetingId, req.user.id]
    );

    return res.json({
      message: 'Votes submitted successfully.',
      votes: updatedVoteRows.map(formatVote),
    });
  } catch (error) {
    await connection.rollback();
    console.error('Submit Type 2 votes error:', error);
    return res.status(500).json({ error: 'Unable to submit Type 2 votes.' });
  } finally {
    connection.release();
  }
});

router.get('/type2/meetings/:meetingId/results', authMiddleware, async (req, res) => {
  const meetingId = Number(req.params.meetingId);

  try {
    const [meetingRows] = await pool.execute(
      `
      SELECT
        m.id,
        m.owner_id,
        m.title,
        m.description,
        m.status,
        m.final_slot_id AS finalSlotId,
        m.created_at AS createdAt,
        owner.id AS ownerUserId,
        owner.name AS ownerName,
        owner.email AS ownerEmail,
        owner.role AS ownerRole
      FROM type2_meetings m
      JOIN users owner ON owner.id = m.owner_id
      WHERE m.id = ?
      LIMIT 1
      `,
      [meetingId]
    );

    const meetingRow = meetingRows[0];

    if (!meetingRow) {
      return res.status(404).json({ error: 'Type 2 meeting not found.' });
    }

    const isOwner = Number(meetingRow.owner_id) === Number(req.user.id);

    if (!isOwner) {
      const [inviteeCheckRows] = await pool.execute(
        `
        SELECT id
        FROM type2_meeting_invitees
        WHERE meeting_id = ? AND user_id = ?
        LIMIT 1
        `,
        [meetingId, req.user.id]
      );

      if (!inviteeCheckRows[0]) {
        return res.status(403).json({ error: 'Not authorized to view Type 2 results.' });
      }
    }

    const [slotRows] = await pool.execute(
      `
      SELECT
        s.id,
        s.meeting_id AS meetingId,
        s.start_time AS start,
        s.end_time AS end,
        COUNT(CASE WHEN v.is_available = 1 THEN 1 END) AS availableCount
      FROM type2_meeting_slots s
      LEFT JOIN type2_meeting_votes v ON v.slot_id = s.id
      WHERE s.meeting_id = ?
      GROUP BY s.id, s.meeting_id, s.start_time, s.end_time
      ORDER BY availableCount DESC, s.start_time ASC
      `,
      [meetingId]
    );

    const [voteDetailRows] = await pool.execute(
      `
      SELECT
        v.slot_id AS slotId,
        v.user_id AS userId,
        v.is_available AS isAvailable,
        u.name,
        u.email
      FROM type2_meeting_votes v
      JOIN users u ON u.id = v.user_id
      WHERE v.meeting_id = ?
      ORDER BY v.slot_id, u.name
      `,
      [meetingId]
    );

    let finalSlot = null;

    if (meetingRow.finalSlotId) {
      const [finalSlotRows] = await pool.execute(
        `
        SELECT
          s.id,
          s.meeting_id AS meetingId,
          s.start_time AS start,
          s.end_time AS end
        FROM type2_meeting_slots s
        WHERE s.id = ? AND s.meeting_id = ?
        LIMIT 1
        `,
        [meetingRow.finalSlotId, meetingId]
      );

      if (finalSlotRows[0]) {
        finalSlot = formatMeetingSlot(finalSlotRows[0]);
      }
    }

    return res.json({
      meeting: formatMeeting(meetingRow),
      finalSlot,
      results: slotRows.map((row) => ({
        slot: {
          id: row.id,
          meetingId: row.meetingId,
          start: toIsoString(row.start),
          end: toIsoString(row.end),
        },
        availableCount: Number(row.availableCount || 0),
      })),
      voteDetails: voteDetailRows.map((row) => ({
        slotId: row.slotId,
        userId: row.userId,
        name: row.name,
        email: row.email,
        isAvailable: Boolean(row.isAvailable),
      })),
    });
  } catch (error) {
    console.error('Get Type 2 results error:', error);
    return res.status(500).json({ error: 'Unable to fetch Type 2 results.' });
  }
});

router.patch('/type2/meetings/:meetingId/final-slot', authMiddleware, ownerOnly, async (req, res) => {
  const meetingId = Number(req.params.meetingId);
  const slotId = Number(req.body.slotId);

  if (!Number.isInteger(slotId) || slotId <= 0) {
    return res.status(400).json({ error: 'Valid slot ID is required.' });
  }

  try {
    const [meetingRows] = await pool.execute(
      `
      SELECT id, owner_id
      FROM type2_meetings
      WHERE id = ? AND owner_id = ?
      LIMIT 1
      `,
      [meetingId, req.user.id]
    );

    if (!meetingRows[0]) {
      return res.status(404).json({ error: 'Type 2 meeting not found.' });
    }

    const [slotRows] = await pool.execute(
      `
      SELECT id
      FROM type2_meeting_slots
      WHERE id = ? AND meeting_id = ?
      LIMIT 1
      `,
      [slotId, meetingId]
    );

    if (!slotRows[0]) {
      return res.status(400).json({ error: 'Selected slot does not belong to this meeting.' });
    }

    await pool.execute(
      `
      UPDATE type2_meetings
      SET final_slot_id = ?, status = 'closed'
      WHERE id = ? AND owner_id = ?
      `,
      [slotId, meetingId, req.user.id]
    );

    const [rows] = await pool.execute(
      `
      SELECT
        m.id,
        m.title,
        m.description,
        m.status,
        m.final_slot_id AS finalSlotId,
        m.created_at AS createdAt,
        owner.id AS ownerUserId,
        owner.name AS ownerName,
        owner.email AS ownerEmail,
        owner.role AS ownerRole
      FROM type2_meetings m
      JOIN users owner ON owner.id = m.owner_id
      WHERE m.id = ?
      LIMIT 1
      `,
      [meetingId]
    );

    return res.json({
      meeting: formatMeeting(rows[0]),
      message: 'Final meeting time selected successfully.',
    });
  } catch (error) {
    console.error('Set Type 2 final slot error:', error);
    return res.status(500).json({ error: 'Unable to set final meeting time.' });
  }
});

router.patch('/type2/meetings/:meetingId/status', authMiddleware, ownerOnly, async (req, res) => {
  const meetingId = Number(req.params.meetingId);
  const status = String(req.body.status || '').trim().toLowerCase();

  if (!['open', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Status must be open or closed.' });
  }

  try {
    const [updateResult] = await pool.execute(
      `
      UPDATE type2_meetings
      SET status = ?
      WHERE id = ? AND owner_id = ?
      `,
      [status, meetingId, req.user.id]
    );

    if (!updateResult.affectedRows) {
      return res.status(404).json({ error: 'Type 2 meeting not found.' });
    }

    const [rows] = await pool.execute(
      `
      SELECT
        m.id,
        m.title,
        m.description,
        m.status,
        m.final_slot_id AS finalSlotId,
        m.created_at AS createdAt,
        owner.id AS ownerUserId,
        owner.name AS ownerName,
        owner.email AS ownerEmail,
        owner.role AS ownerRole
      FROM type2_meetings m
      JOIN users owner ON owner.id = m.owner_id
      WHERE m.id = ?
      LIMIT 1
      `,
      [meetingId]
    );

    return res.json({ meeting: formatMeeting(rows[0]) });
  } catch (error) {
    console.error('Update Type 2 meeting status error:', error);
    return res.status(500).json({ error: 'Unable to update Type 2 meeting status.' });
  }
});

router.delete('/type2/meetings/:meetingId', authMiddleware, ownerOnly, async (req, res) => {
  const meetingId = Number(req.params.meetingId);

  try {
    const [rows] = await pool.execute(
      `
      SELECT id
      FROM type2_meetings
      WHERE id = ? AND owner_id = ?
      LIMIT 1
      `,
      [meetingId, req.user.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Type 2 meeting not found.' });
    }

    await pool.execute(
      `DELETE FROM type2_meetings WHERE id = ? AND owner_id = ?`,
      [meetingId, req.user.id]
    );

    return res.json({
      deletedMeetingId: meetingId,
      message: 'Type 2 meeting deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Type 2 meeting error:', error);
    return res.status(500).json({ error: 'Unable to delete Type 2 meeting.' });
  }
});

router.post('/type2/meetings/:meetingId/invitees', authMiddleware, ownerOnly, async (req, res) => {
  const meetingId = Number(req.params.meetingId);
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ error: 'Invitee email is required.' });
  }

  if (!isMcGillEmail(email)) {
    return res.status(400).json({ error: `Invalid McGill email: ${email}` });
  }

  try {
    const [meetingRows] = await pool.execute(
      `
      SELECT id
      FROM type2_meetings
      WHERE id = ? AND owner_id = ?
      LIMIT 1
      `,
      [meetingId, req.user.id]
    );

    if (!meetingRows[0]) {
      return res.status(404).json({ error: 'Type 2 meeting not found.' });
    }

    const [userRows] = await pool.execute(
      `
      SELECT id, name, email, role
      FROM users
      WHERE LOWER(email) = ?
      LIMIT 1
      `,
      [email]
    );

    const invitee = userRows[0];

    if (!invitee) {
      return res.status(400).json({ error: `This invited user is not registered yet: ${email}` });
    }

    if (Number(invitee.id) === Number(req.user.id)) {
      return res.status(400).json({ error: 'Owner cannot invite themselves.' });
    }

    await pool.execute(
      `
      INSERT INTO type2_meeting_invitees (meeting_id, user_id)
      VALUES (?, ?)
      `,
      [meetingId, invitee.id]
    );

    return res.status(201).json({
      invitee: {
        id: invitee.id,
        name: invitee.name,
        email: invitee.email,
        role: invitee.role,
      },
      message: 'Invitee added successfully.',
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'That user is already invited.' });
    }

    console.error('Add Type 2 invitee error:', error);
    return res.status(500).json({ error: 'Unable to add invitee.' });
  }
});

router.delete('/type2/meetings/:meetingId/invitees/:userId', authMiddleware, ownerOnly, async (req, res) => {
  const meetingId = Number(req.params.meetingId);
  const userId = Number(req.params.userId);

  try {
    const [meetingRows] = await pool.execute(
      `
      SELECT id
      FROM type2_meetings
      WHERE id = ? AND owner_id = ?
      LIMIT 1
      `,
      [meetingId, req.user.id]
    );

    if (!meetingRows[0]) {
      return res.status(404).json({ error: 'Type 2 meeting not found.' });
    }

    const [deleteResult] = await pool.execute(
      `
      DELETE FROM type2_meeting_invitees
      WHERE meeting_id = ? AND user_id = ?
      `,
      [meetingId, userId]
    );

    if (!deleteResult.affectedRows) {
      return res.status(404).json({ error: 'Invitee not found.' });
    }

    await pool.execute(
      `
      DELETE FROM type2_meeting_votes
      WHERE meeting_id = ? AND user_id = ?
      `,
      [meetingId, userId]
    );

    return res.json({
      deletedUserId: userId,
      message: 'Invitee removed successfully.',
    });
  } catch (error) {
    console.error('Remove Type 2 invitee error:', error);
    return res.status(500).json({ error: 'Unable to remove invitee.' });
  }
});

router.post('/type2/meetings/:meetingId/slots', authMiddleware, ownerOnly, async (req, res) => {
  const meetingId = Number(req.params.meetingId);
  const start = String(req.body.start || '').trim();
  const end = String(req.body.end || '').trim();

  if (!start || !end) {
    return res.status(400).json({ error: 'Start and end time are required.' });
  }

  if (new Date(start).getTime() >= new Date(end).getTime()) {
    return res.status(400).json({ error: 'End time must be after start time.' });
  }

  try {
    const [meetingRows] = await pool.execute(
      `
      SELECT id
      FROM type2_meetings
      WHERE id = ? AND owner_id = ?
      LIMIT 1
      `,
      [meetingId, req.user.id]
    );

    if (!meetingRows[0]) {
      return res.status(404).json({ error: 'Type 2 meeting not found.' });
    }

    const [result] = await pool.execute(
      `
      INSERT INTO type2_meeting_slots (meeting_id, start_time, end_time)
      VALUES (?, ?, ?)
      `,
      [meetingId, new Date(start), new Date(end)]
    );

    const [rows] = await pool.execute(
      `
      SELECT
        s.id,
        s.meeting_id AS meetingId,
        s.start_time AS start,
        s.end_time AS end
      FROM type2_meeting_slots s
      WHERE s.id = ?
      LIMIT 1
      `,
      [result.insertId]
    );

    return res.status(201).json({
      slot: formatMeetingSlot(rows[0]),
      message: 'Candidate slot added successfully.',
    });
  } catch (error) {
    console.error('Add Type 2 slot error:', error);
    return res.status(500).json({ error: 'Unable to add candidate slot.' });
  }
});

router.delete('/type2/meetings/:meetingId/slots/:slotId', authMiddleware, ownerOnly, async (req, res) => {
  const meetingId = Number(req.params.meetingId);
  const slotId = Number(req.params.slotId);

  try {
    const [meetingRows] = await pool.execute(
      `
      SELECT id
      FROM type2_meetings
      WHERE id = ? AND owner_id = ?
      LIMIT 1
      `,
      [meetingId, req.user.id]
    );

    if (!meetingRows[0]) {
      return res.status(404).json({ error: 'Type 2 meeting not found.' });
    }

    const [deleteResult] = await pool.execute(
      `
      DELETE FROM type2_meeting_slots
      WHERE id = ? AND meeting_id = ?
      `,
      [slotId, meetingId]
    );

    if (!deleteResult.affectedRows) {
      return res.status(404).json({ error: 'Candidate slot not found.' });
    }

    return res.json({
      deletedSlotId: slotId,
      message: 'Candidate slot removed successfully.',
    });
  } catch (error) {
    console.error('Remove Type 2 slot error:', error);
    return res.status(500).json({ error: 'Unable to remove candidate slot.' });
  }
});

module.exports = router;