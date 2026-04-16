// Author: Jenny Hua

//helper function to build mailto link for email notifications between owners and users
export function buildMailto(email, subject, body) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    body,
  )}`;
}
