// Author: Jenny Hua
const { publicUser } = require('./users');

function formatSlot(store, slot) {
  const owner = store.users.find((user) => user.id === slot.ownerId);
  const bookedBy = slot.bookedByUserId
    ? store.users.find((user) => user.id === slot.bookedByUserId)
    : null;

  return {
    id: slot.id,
    title: slot.title,
    start: slot.start,
    end: slot.end,
    location: slot.location || '',
    notes: slot.notes || '',
    isActive: slot.isActive,
    invitationKey: slot.ownerId,
    owner: owner ? publicUser(owner) : null,
    bookedBy: bookedBy ? publicUser(bookedBy) : null,
  };
}

module.exports = { formatSlot };
