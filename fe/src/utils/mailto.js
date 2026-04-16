// Author: Jenny Hua

//helper function to build mailto link for email notifications between owners and users
export function createMailto(email, subject, body) {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${email}?${params.toString()}`;
}
