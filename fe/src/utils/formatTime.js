 // Author: Yongrong Yang

 //format time for display
  export const formatDateTimeRange = (start, end) => {
    const date = new Date(start).toLocaleDateString();
    const startTime = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${date} ${startTime} - ${endTime}`;
  };