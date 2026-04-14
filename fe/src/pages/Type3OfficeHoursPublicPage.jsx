/* Author: Hanjing Zheng */

// import { useMemo, useState } from 'react';
// import './SchedulerPages.css';
// import UserCalendarTopnav from '../components/CalendarTopnav';
// import CalendarGrid from '../components/CalendarGrid';

// function addDays(dateInput, days) {
//   const next = new Date(dateInput);
//   next.setDate(next.getDate() + days);
//   return next;
// }

// function formatReadableDateTime(dateInput) {
//   const date = new Date(dateInput);
//   return date.toLocaleString([], {
//     dateStyle: 'medium',
//     timeStyle: 'short',
//   });
// }

// function generateWeeklyPublicSlots(baseSlots, weeks) {
//   const safeWeeks = Math.max(1, Number(weeks) || 1);
//   const allSlots = [];

//   baseSlots.forEach((slot) => {
//     const baseStart = new Date(slot.start);
//     const baseEnd = new Date(slot.end);

//     for (let weekIndex = 0; weekIndex < safeWeeks; weekIndex += 1) {
//       const repeatedStart = addDays(baseStart, weekIndex * 7);
//       const repeatedEnd = addDays(baseEnd, weekIndex * 7);

//       allSlots.push({
//         id: `${slot.id}-week-${weekIndex + 1}`,
//         baseSlotId: slot.id,
//         title: slot.title,
//         start: repeatedStart,
//         end: repeatedEnd,
//         bookedBy: null,
//         weekIndex: weekIndex + 1,
//       });
//     }
//   });

//   return allSlots.sort(
//     (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
//   );
// }

// function Type3OfficeHoursPublicPage({ onBack, onLogout, user, type3Draft }) {
//   const [bookedSlotIds, setBookedSlotIds] = useState([]);
//   const [selectedSlotId, setSelectedSlotId] = useState(null);
//   const [message, setMessage] = useState('');
//   const [error, setError] = useState('');

//   const publicSlots = useMemo(() => {
//     return generateWeeklyPublicSlots(type3Draft.savedBaseSlots, type3Draft.weeks);
//   }, [type3Draft]);

//   const calendarEvents = useMemo(() => {
//     return publicSlots.map((slot) => ({
//       id: slot.id,
//       title: bookedSlotIds.includes(slot.id)
//         ? `${slot.title} (Booked)`
//         : slot.title,
//       start: slot.start,
//       end: slot.end,
//       extendedProps: {
//         baseSlotId: slot.baseSlotId,
//         weekIndex: slot.weekIndex,
//         isBooked: bookedSlotIds.includes(slot.id),
//       },
//     }));
//   }, [publicSlots, bookedSlotIds]);

//   const selectedSlot = useMemo(() => {
//     return publicSlots.find((slot) => slot.id === selectedSlotId) || null;
//   }, [publicSlots, selectedSlotId]);

//   const handleBookSlot = (slotId) => {
//     setMessage('');
//     setError('');

//     if (bookedSlotIds.includes(slotId)) {
//       setError('This slot is already booked.');
//       return;
//     }

//     setBookedSlotIds((current) => [...current, slotId]);
//     setMessage('Slot booked successfully in frontend preview.');
//   };

//   const handleCalendarEventClick = (calendarEvent) => {
//     setSelectedSlotId(calendarEvent.id);
//     setMessage('');
//     setError('');
//   };

//   return (
//     <>
//       <UserCalendarTopnav
//         userEmail={user?.email}
//         onLogout={onLogout}
//         onBackHome={onBack}
//       />

//       <main className="booking-page">
//         <header className="booking-header">
//           <h1>Available Office Hours</h1>
//           <p className="booking-subtitle">
//             Browse available recurring office-hour sessions and select one to book.
//           </p>
//         </header>

//         {message && <p className="notice success">{message}</p>}
//         {error && <p className="notice error">{error}</p>}

//         <section className="booking-layout">
//           <section className="card booking-side-panel">
//             <h2>Available Sessions</h2>

//             {publicSlots.length === 0 ? (
//               <p>No office-hour sessions are available yet.</p>
//             ) : (
//               <div className="summary-list summary-list-scroll">
//                 {publicSlots.map((slot) => {
//                   const isBooked = bookedSlotIds.includes(slot.id);
//                   const isSelected = selectedSlotId === slot.id;

//                   return (
//                     <div
//                       key={slot.id}
//                       className={`summary-item ${isSelected ? 'selected-summary-item' : ''}`}
//                     >
//                       <div
//                         className="summary-main"
//                         role="button"
//                         tabIndex={0}
//                         onClick={() => setSelectedSlotId(slot.id)}
//                         onKeyDown={(event) => {
//                           if (event.key === 'Enter' || event.key === ' ') {
//                             setSelectedSlotId(slot.id);
//                           }
//                         }}
//                       >
//                         <p className="summary-title">{slot.title}</p>
//                         <p>Start: {formatReadableDateTime(slot.start)}</p>
//                         <p>End: {formatReadableDateTime(slot.end)}</p>
//                         <p>Week {slot.weekIndex}</p>
//                         <p>Status: {isBooked ? 'Booked' : 'Available'}</p>
//                       </div>

//                       <button
//                         type="button"
//                         className="button secondary"
//                         onClick={() => handleBookSlot(slot.id)}
//                         disabled={isBooked}
//                       >
//                         {isBooked ? 'Booked' : 'Book'}
//                       </button>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </section>

//           <section className="card booking-side-panel">
//             <h2>Selected Session</h2>

//             {!selectedSlot ? (
//               <p>Select a session from the list or calendar.</p>
//             ) : (
//               <div className="summary-list">
//                 <div className="summary-item">
//                   <div className="summary-main">
//                     <p className="summary-title">{selectedSlot.title}</p>
//                     <p>Start: {formatReadableDateTime(selectedSlot.start)}</p>
//                     <p>End: {formatReadableDateTime(selectedSlot.end)}</p>
//                     <p>Week {selectedSlot.weekIndex}</p>
//                     <p>
//                       Status:{' '}
//                       {bookedSlotIds.includes(selectedSlot.id) ? 'Booked' : 'Available'}
//                     </p>
//                   </div>

//                   <button
//                     type="button"
//                     className="button secondary"
//                     onClick={() => handleBookSlot(selectedSlot.id)}
//                     disabled={bookedSlotIds.includes(selectedSlot.id)}
//                   >
//                     {bookedSlotIds.includes(selectedSlot.id) ? 'Booked' : 'Book'}
//                   </button>
//                 </div>
//               </div>
//             )}
//           </section>
//         </section>

//         <section className="card calendar-section">
//           <div className="calendar-section-header">
//             <h2>Calendar View</h2>
//             <p>
//               Click a session on the calendar to select it. Booked sessions are marked in
//               the calendar title.
//             </p>
//           </div>

//           <CalendarGrid
//             mode="readonly"
//             events={calendarEvents}
//             onSelectEvent={handleCalendarEventClick}
//           />
//         </section>
//       </main>
//     </>
//   );
// }

// export default Type3OfficeHoursPublicPage;


/* Author: Hanjing Zheng */

import { useMemo, useState } from 'react';
import './SchedulerPages.css';
import UserCalendarTopnav from '../components/CalendarTopnav';
import CalendarGrid from '../components/CalendarGrid';

function addDays(dateInput, days) {
  const next = new Date(dateInput);
  next.setDate(next.getDate() + days);
  return next;
}

function formatReadableDateTime(dateInput) {
  const date = new Date(dateInput);
  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function generateWeeklyPublicSlots(baseSlots, weeks) {
  const safeWeeks = Math.max(1, Number(weeks) || 1);
  const allSlots = [];

  baseSlots.forEach((slot) => {
    const baseStart = new Date(slot.start);
    const baseEnd = new Date(slot.end);

    for (let weekIndex = 0; weekIndex < safeWeeks; weekIndex += 1) {
      const repeatedStart = addDays(baseStart, weekIndex * 7);
      const repeatedEnd = addDays(baseEnd, weekIndex * 7);

      allSlots.push({
        id: `${slot.id}-week-${weekIndex + 1}`,
        baseSlotId: slot.id,
        title: slot.title,
        start: repeatedStart,
        end: repeatedEnd,
        weekIndex: weekIndex + 1,
        capacity: slot.capacity ?? 1,
      });
    }
  });

  return allSlots.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
}

function Type3OfficeHoursPublicPage({ onBack, onLogout, user, type3Draft }) {
  const [bookingCounts, setBookingCounts] = useState({});
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const publicSlots = useMemo(() => {
    return generateWeeklyPublicSlots(type3Draft.savedBaseSlots, type3Draft.weeks);
  }, [type3Draft]);

  const calendarEvents = useMemo(() => {
    return publicSlots.map((slot) => {
      const bookedCount = bookingCounts[slot.id] || 0;
      const isFull = bookedCount >= slot.capacity;

      return {
        id: slot.id,
        title: isFull
          ? `${slot.title} (Full)`
          : `${slot.title} (${bookedCount}/${slot.capacity})`,
        start: slot.start,
        end: slot.end,
        extendedProps: {
          baseSlotId: slot.baseSlotId,
          weekIndex: slot.weekIndex,
          bookedCount,
          capacity: slot.capacity,
          isFull,
        },
      };
    });
  }, [publicSlots, bookingCounts]);

  const selectedSlot = useMemo(() => {
    return publicSlots.find((slot) => slot.id === selectedSlotId) || null;
  }, [publicSlots, selectedSlotId]);

  const handleBookSlot = (slotId) => {
    setMessage('');
    setError('');

    const slot = publicSlots.find((item) => item.id === slotId);
    if (!slot) {
      setError('Slot not found.');
      return;
    }

    const currentBookedCount = bookingCounts[slotId] || 0;

    if (currentBookedCount >= slot.capacity) {
      setError('This slot has reached its maximum capacity.');
      return;
    }

    setBookingCounts((current) => ({
      ...current,
      [slotId]: currentBookedCount + 1,
    }));

    setMessage('Reservation added in frontend preview.');
  };

  const handleCalendarEventClick = (calendarEvent) => {
    setSelectedSlotId(calendarEvent.id);
    setMessage('');
    setError('');
  };

  return (
    <>
      <UserCalendarTopnav
        userEmail={user?.email}
        onLogout={onLogout}
        onBackHome={onBack}
      />

      <main className="booking-page">
        <header className="booking-header">
          <h1>Available Office Hours</h1>
          <p className="booking-subtitle">
            Browse available recurring office-hour sessions and select one to reserve.
          </p>
        </header>

        {message && <p className="notice success">{message}</p>}
        {error && <p className="notice error">{error}</p>}

        <section className="booking-layout">
          <section className="card booking-side-panel">
            <h2>Available Sessions</h2>

            {publicSlots.length === 0 ? (
              <p>No office-hour sessions are available yet.</p>
            ) : (
              <div className="summary-list summary-list-scroll">
                {publicSlots.map((slot) => {
                  const bookedCount = bookingCounts[slot.id] || 0;
                  const isFull = bookedCount >= slot.capacity;
                  const isSelected = selectedSlotId === slot.id;

                  return (
                    <div
                      key={slot.id}
                      className={`summary-item ${isSelected ? 'selected-summary-item' : ''}`}
                    >
                      <div
                        className="summary-main"
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedSlotId(slot.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            setSelectedSlotId(slot.id);
                          }
                        }}
                      >
                        <p className="summary-title">{slot.title}</p>
                        <p>Start: {formatReadableDateTime(slot.start)}</p>
                        <p>End: {formatReadableDateTime(slot.end)}</p>
                        <p>Week {slot.weekIndex}</p>
                        <p>Reserved: {bookedCount} / {slot.capacity}</p>
                        <p>Status: {isFull ? 'Full' : 'Available'}</p>
                      </div>

                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => handleBookSlot(slot.id)}
                        disabled={isFull}
                      >
                        {isFull ? 'Full' : 'Reserve'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="card booking-side-panel">
            <h2>Selected Session</h2>

            {!selectedSlot ? (
              <p>Select a session from the list or calendar.</p>
            ) : (
              <div className="summary-list">
                <div className="summary-item">
                  <div className="summary-main">
                    <p className="summary-title">{selectedSlot.title}</p>
                    <p>Start: {formatReadableDateTime(selectedSlot.start)}</p>
                    <p>End: {formatReadableDateTime(selectedSlot.end)}</p>
                    <p>Week {selectedSlot.weekIndex}</p>
                    <p>
                      Reserved: {(bookingCounts[selectedSlot.id] || 0)} / {selectedSlot.capacity}
                    </p>
                    <p>
                      Status:{' '}
                      {(bookingCounts[selectedSlot.id] || 0) >= selectedSlot.capacity
                        ? 'Full'
                        : 'Available'}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => handleBookSlot(selectedSlot.id)}
                    disabled={(bookingCounts[selectedSlot.id] || 0) >= selectedSlot.capacity}
                  >
                    {(bookingCounts[selectedSlot.id] || 0) >= selectedSlot.capacity
                      ? 'Full'
                      : 'Reserve'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </section>

        <section className="card calendar-section">
          <div className="calendar-section-header">
            <h2>Calendar View</h2>
            <p>
              Click a session on the calendar to select it. The title shows current
              reservations versus capacity.
            </p>
          </div>

          <CalendarGrid
            mode="readonly"
            events={calendarEvents}
            onSelectEvent={handleCalendarEventClick}
          />
        </section>
      </main>
    </>
  );
}

export default Type3OfficeHoursPublicPage;