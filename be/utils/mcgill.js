// Author: Jenny Hua
function isMcGillEmail(email = '') {
  return /@(mail\.)?mcgill\.ca$/i.test(email.trim());
}

function isOwnerEmail(email = '') {
  return /@mcgill\.ca$/i.test(email.trim());
}

module.exports = {
  isMcGillEmail,
  isOwnerEmail,
};
