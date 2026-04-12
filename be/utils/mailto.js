// Author: Jenny Hua
function buildMailto(email, subject, body) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    body,
  )}`;
}

module.exports = { buildMailto };
