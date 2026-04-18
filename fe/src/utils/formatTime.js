// Author: Yongrong Yang

// Always show both start and end dates.
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