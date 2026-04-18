// Author: Yongrong Yang

// Returns local current time formatted for <input type="datetime-local">.
export const getDateTimeLocalNow = () => {
  const now = new Date();
  now.setSeconds(0, 0);
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
};
