// Author: Jenny Hua
const SLOT_SELECT = `
  SELECT
    s.id,
    s.owner_id AS ownerId,
    s.title,
    s.start_time AS start,
    s.end_time AS end,
    s.location,
    s.notes,
    s.is_active AS isActive,
    s.booked_by_user_id AS bookedByUserId,
    owner.id AS ownerUserId,
    owner.name AS ownerName,
    owner.email AS ownerEmail,
    owner.role AS ownerRole,
    booked.id AS bookedUserIdValue,
    booked.name AS bookedUserName,
    booked.email AS bookedUserEmail,
    booked.role AS bookedUserRole
  FROM slots s
  JOIN users owner ON owner.id = s.owner_id
  LEFT JOIN users booked ON booked.id = s.booked_by_user_id
`;

function toIsoString(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function formatSlot(row) {
  return {
    id: row.id,
    title: row.title,
    start: toIsoString(row.start),
    end: toIsoString(row.end),
    location: row.location || '',
    notes: row.notes || '',
    isActive: Boolean(row.isActive),
    invitationKey: row.ownerId,
    owner: row.ownerUserId
      ? {
          id: row.ownerUserId,
          name: row.ownerName,
          email: row.ownerEmail,
          role: row.ownerRole,
        }
      : null,
    bookedBy: row.bookedUserIdValue
      ? {
          id: row.bookedUserIdValue,
          name: row.bookedUserName,
          email: row.bookedUserEmail,
          role: row.bookedUserRole,
        }
      : null,
  };
}

module.exports = { SLOT_SELECT, formatSlot };
