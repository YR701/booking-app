// Author: Jenny Hua

// URLSearchParams uses "+" for spaces; swap to "%20" so mailto drafts don't show "+".
export function mailtoQueryString(params) {
  return params.toString().replaceAll('+', '%20');
}
