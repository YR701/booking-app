// Author: Yongrong Yang

// Returns local current time formatted for <input type="datetime-local">
export const getDateTimeLocalNow = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

// Converts input date to local datetime-local format for calendar components
export const toDateTimeLocalValue = (dateInput) => {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '';

    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
