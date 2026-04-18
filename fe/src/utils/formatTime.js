// Author: Yongrong Yang

// Format date and time for booking page and userdashboard
export const formatDateTimeRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return '';
  }

  const startDateText = startDate.toLocaleDateString();
  const startTimeText = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endDateText = endDate.toLocaleDateString();
  const endTimeText = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return `${startDateText} ${startTimeText} - ${endDateText} ${endTimeText}`;
};

// Formats a single date-time value for Type 2 and 3 pages
export const formatReadableDateTime = (dateInput) => {
  const date = new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};