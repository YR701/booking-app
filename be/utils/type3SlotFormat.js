/* Author: Hanjing Zheng */

function toIsoString(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

const TYPE3_SLOT_SELECT = `
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
    COUNT(b.id) AS bookedCount
  FROM type3_slots s
  JOIN users owner ON owner.id = s.owner_id
  LEFT JOIN type3_slot_bookings b ON b.slot_id = s.id
`;

function formatType3Slot(row, currentUserId = null) {
  const bookedCount = Number(row.bookedCount || 0);
  const capacity = Number(row.capacity || 1);
  const isFull = Boolean(row.isFull);

  return {
    id: row.id,
    title: row.title,
    start: toIsoString(row.start),
    end: toIsoString(row.end),
    location: row.location || '',
    notes: row.notes || '',
    isActive: Boolean(row.isActive),
    capacity,
    bookedCount,
    isFull,
    isAvailable: Boolean(row.isActive) && !isFull,
    reservedByMe: row.reservedByMe !== undefined
      ? Boolean(row.reservedByMe)
      : false,
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

module.exports = { TYPE3_SLOT_SELECT, formatType3Slot };