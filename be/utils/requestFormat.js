// Author: Yongrong Yang
const REQUEST_SELECT = `
  SELECT
    r.id,
    r.requester_id AS requesterId,
    r.owner_id AS ownerId,
    r.title,
    r.start_time AS start,
    r.end_time AS end,
    r.reason,
    r.status,
    r.created_at AS createdAt,
    requester.id AS requesterUserId,
    requester.name AS requesterName,
    requester.email AS requesterEmail,
    requester.role AS requesterRole,
    owner.id AS ownerUserId,
    owner.name AS ownerName,
    owner.email AS ownerEmail,
    owner.role AS ownerRole
  FROM request r
  JOIN users requester ON requester.id = r.requester_id
  JOIN users owner ON owner.id = r.owner_id
`;

function toIsoString(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function formatRequest(row) {
  return {
    id: row.id,
    title: row.title,
    start: toIsoString(row.start),
    end: toIsoString(row.end),
    reason: row.reason || '',
    status: row.status,
    createdAt: toIsoString(row.createdAt),
    requester: row.requesterUserId
      ? {
          id: row.requesterUserId,
          name: row.requesterName,
          email: row.requesterEmail,
          role: row.requesterRole,
        }
      : null,
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

module.exports = { REQUEST_SELECT, formatRequest };
