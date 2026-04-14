/* Author: Hanjing Zheng */

// import { useEffect, useMemo, useState } from 'react';
// import './SchedulerPages.css';
// import './switchButton.css';
// import DashboardTopnav from '../components/DashboardTopnav';
// import CalendarGrid from '../components/CalendarGrid';

// const API_BASE = 'http://localhost:4000/api';
// const TOKEN_KEY = 'comp307-booking-token';

// function formatReadableDateTime(dateInput) {
//   const date = new Date(dateInput);
//   return date.toLocaleString([], {
//     dateStyle: 'medium',
//     timeStyle: 'short',
//   });
// }

// function Type3OfficeHoursPublicPage({ onBack, onLogout, user, onOpenType2Vote, onOpenUserDashboard }) {
//   const [publicSlots, setPublicSlots] = useState([]);
//   const [selectedOwnerId, setSelectedOwnerId] = useState('');
//   const [selectedSlotId, setSelectedSlotId] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reservingSlotId, setReservingSlotId] = useState(null);
//   const [message, setMessage] = useState('');
//   const [error, setError] = useState('');

//   const fetchPublicSlots = async () => {
//     try {
//       setLoading(true);

//       const token = localStorage.getItem(TOKEN_KEY);
//       if (!token) {
//         setPublicSlots([]);
//         return;
//       }

//       const response = await fetch(`${API_BASE}/type3/slots`, {
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const data = await response.json().catch(() => ({}));

//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to load Type 3 public slots.');
//       }

//       setPublicSlots(data.slots || []);
//       setError('');
//     } catch (fetchError) {
//       console.error(fetchError);
//       setError(fetchError.message || 'Unable to load public Type 3 slots.');
//       setPublicSlots([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     void fetchPublicSlots();
//   }, [user]);

//   const availableOwners = useMemo(() => {
//     const ownerMap = new Map();

//     publicSlots.forEach((slot) => {
//       if (slot.owner?.id && slot.owner?.name) {
//         ownerMap.set(String(slot.owner.id), {
//           id: String(slot.owner.id),
//           name: slot.owner.name,
//           email: slot.owner.email || '',
//         });
//       }
//     });

//     return [...ownerMap.values()].sort((a, b) => a.name.localeCompare(b.name));
//   }, [publicSlots]);

//   const filteredSlots = useMemo(() => {
//     const onlyAvailable = publicSlots.filter((slot) => slot.isAvailable);

//     if (!selectedOwnerId) {
//       return onlyAvailable.sort(
//         (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
//       );
//     }

//     return onlyAvailable
//       .filter((slot) => String(slot.owner?.id) === String(selectedOwnerId))
//       .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
//   }, [publicSlots, selectedOwnerId]);

//   const selectedOwner = useMemo(() => {
//     return availableOwners.find(
//       (ownerItem) => String(ownerItem.id) === String(selectedOwnerId)
//     ) || null;
//   }, [availableOwners, selectedOwnerId]);

//   const calendarEvents = useMemo(() => {
//     return filteredSlots.map((slot) => ({
//       id: String(slot.id),
//       title: `${slot.title} (${slot.bookedCount || 0}/${slot.capacity || 1})`,
//       start: slot.start,
//       end: slot.end,
//       extendedProps: {
//         capacity: slot.capacity || 1,
//         bookedCount: slot.bookedCount || 0,
//         isAvailable: slot.isAvailable,
//         ownerName: slot.owner?.name || '',
//         ownerEmail: slot.owner?.email || '',
//       },
//     }));
//   }, [filteredSlots]);

//   const selectedSlot = useMemo(() => {
//     return filteredSlots.find(
//       (slot) => String(slot.id) === String(selectedSlotId)
//     ) || null;
//   }, [filteredSlots, selectedSlotId]);

//   const handleOwnerChange = (event) => {
//     const ownerId = event.target.value;
//     setSelectedOwnerId(ownerId);
//     setSelectedSlotId(null);
//     setMessage('');
//     setError('');
//   };

//   const handleReserveSlot = async (slotId) => {
//     try {
//       setMessage('');
//       setError('');
//       setReservingSlotId(slotId);

//       const token = localStorage.getItem(TOKEN_KEY);
//       if (!token) {
//         throw new Error('You must be logged in to reserve a Type 3 slot.');
//       }

//       const response = await fetch(`${API_BASE}/type3/slots/${slotId}/book`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const data = await response.json().catch(() => ({}));

//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to reserve Type 3 slot.');
//       }

//       setMessage('Type 3 slot reserved successfully.');

//       setPublicSlots((current) =>
//         current.map((slot) =>
//           String(slot.id) === String(slotId) ? data.slot : slot
//         )
//       );

//       if (String(selectedSlotId) === String(slotId)) {
//         setSelectedSlotId(null);
//       }
//     } catch (reserveError) {
//       console.error(reserveError);
//       setError(reserveError.message || 'Unable to reserve Type 3 slot.');
//     } finally {
//       setReservingSlotId(null);
//     }
//   };

//   const handleCalendarEventClick = (calendarEvent) => {
//     setSelectedSlotId(calendarEvent.id);
//     setMessage('');
//     setError('');
//   };

//   return (
//     <>
//       <DashboardTopnav
//         userEmail={user?.email || 'user@mail.mcgill.ca'}
//         userName={user?.name || 'Student'}
//         onLogout={onLogout}
//       />

//       {/* switch to other pages */}
//       <div className="switch-buttons">
//         <div className="inline-actions">
//           {onOpenUserDashboard && (
//             <button type="button" onClick={onOpenUserDashboard}>
//               Back to User Dashboard
//             </button>
//           )}
//           {onOpenType2Vote && (
//             <button type="button" onClick={onOpenType2Vote}>
//               Type 2 Vote
//             </button>
//           )}
//         </div>
//       </div>

//       <main className="booking-page">
//         <header className="booking-header">
//           <h1>Available Type 3 Office Hours</h1>
//           <p className="booking-subtitle">
//             Select a professor first, then browse that professor’s available office-hour
//             sessions and reserve one.
//           </p>
//         </header>

//         {message && <p className="notice success">{message}</p>}
//         {error && <p className="notice error">{error}</p>}

//         <section className="booking-layout">
//           <section className="card booking-form">
//             <h2>Select Professor</h2>

//             <label>
//               Professor / Owner
//               <select value={selectedOwnerId} onChange={handleOwnerChange}>
//                 <option value="">-- Select a professor --</option>
//                 {availableOwners.map((ownerItem) => (
//                   <option key={ownerItem.id} value={ownerItem.id}>
//                     {ownerItem.name}
//                   </option>
//                 ))}
//               </select>
//             </label>

//             {selectedOwner ? (
//               <div className="invitee-preview-box">
//                 <p className="summary-title">Selected Professor</p>
//                 <p>{selectedOwner.name}</p>
//                 <p>{selectedOwner.email}</p>
//               </div>
//             ) : (
//               <p className="helper-text">
//                 Choose a professor to see only that professor’s available Type 3 office hours.
//               </p>
//             )}

//             <div className="invitee-preview-box">
//               <p className="summary-title">Current Filter</p>
//               <p>
//                 {selectedOwner
//                   ? `Showing available office hours for ${selectedOwner.name}.`
//                   : 'No professor selected yet.'}
//               </p>
//             </div>
//           </section>

//           <section className="card booking-side-panel">
//             <h2>Available Sessions</h2>

//             {loading ? (
//               <p>Loading public Type 3 sessions...</p>
//             ) : !selectedOwnerId ? (
//               <p>Please select a professor first.</p>
//             ) : filteredSlots.length === 0 ? (
//               <p>No available office-hour sessions for this professor.</p>
//             ) : (
//               <div className="summary-list summary-list-scroll">
//                 {filteredSlots.map((slot) => {
//                   const isSelected = String(selectedSlotId) === String(slot.id);
//                   const isFull = !slot.isAvailable;

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
//                         <p>Professor: {slot.owner?.name || 'Unknown'}</p>
//                         <p>Start: {formatReadableDateTime(slot.start)}</p>
//                         <p>End: {formatReadableDateTime(slot.end)}</p>
//                         <p>Reserved: {slot.bookedCount || 0} / {slot.capacity || 1}</p>
//                         <p>Status: {isFull ? 'Full' : 'Available'}</p>
//                       </div>

//                       <button
//                         type="button"
//                         className="button secondary"
//                         onClick={() => handleReserveSlot(slot.id)}
//                         disabled={isFull || reservingSlotId === slot.id}
//                       >
//                         {isFull
//                           ? 'Full'
//                           : reservingSlotId === slot.id
//                             ? 'Reserving...'
//                             : 'Reserve'}
//                       </button>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </section>
//         </section>

//         <section className="card booking-side-panel" style={{ marginBottom: '24px' }}>
//           <h2>Selected Session</h2>

//           {!selectedSlot ? (
//             <p>Select a session from the list or calendar.</p>
//           ) : (
//             <div className="summary-list">
//               <div className="summary-item">
//                 <div className="summary-main">
//                   <p className="summary-title">{selectedSlot.title}</p>
//                   <p>Professor: {selectedSlot.owner?.name || 'Unknown'}</p>
//                   <p>Professor Email: {selectedSlot.owner?.email || 'N/A'}</p>
//                   <p>Start: {formatReadableDateTime(selectedSlot.start)}</p>
//                   <p>End: {formatReadableDateTime(selectedSlot.end)}</p>
//                   <p>Reserved: {selectedSlot.bookedCount || 0} / {selectedSlot.capacity || 1}</p>
//                   <p>Status: {selectedSlot.isAvailable ? 'Available' : 'Full'}</p>
//                 </div>

//                 <button
//                   type="button"
//                   className="button secondary"
//                   onClick={() => handleReserveSlot(selectedSlot.id)}
//                   disabled={!selectedSlot.isAvailable || reservingSlotId === selectedSlot.id}
//                 >
//                   {!selectedSlot.isAvailable
//                     ? 'Full'
//                     : reservingSlotId === selectedSlot.id
//                       ? 'Reserving...'
//                       : 'Reserve'}
//                 </button>
//               </div>
//             </div>
//           )}
//         </section>

//         <section className="card calendar-section">
//           <div className="calendar-section-header">
//             <h2>Calendar View</h2>
//             <p>
//               After selecting a professor, only that professor’s available office hours
//               are shown on the calendar.
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

import { useEffect, useMemo, useState } from 'react';
import './SchedulerPages.css';
import './switchButton.css';
import DashboardTopnav from '../components/DashboardTopnav';
import CalendarGrid from '../components/CalendarGrid';

const API_BASE = 'http://localhost:4000/api';
const TOKEN_KEY = 'comp307-booking-token';

function formatReadableDateTime(dateInput) {
  const date = new Date(dateInput);
  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function createMailto(email) {
  return `mailto:${email}`;
}

function Type3OfficeHoursPublicPage({ onBack, onLogout, user, onOpenType2Vote, onOpenUserDashboard }) {
  const [publicSlots, setPublicSlots] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservingSlotId, setReservingSlotId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchPublicSlots = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setPublicSlots([]);
        return;
      }

      const response = await fetch(`${API_BASE}/type3/slots`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load Type 3 public slots.');
      }

      setPublicSlots(data.slots || []);
      setError('');
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || 'Unable to load public Type 3 slots.');
      setPublicSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPublicSlots();
  }, [user]);

  const availableOwners = useMemo(() => {
    const ownerMap = new Map();

    publicSlots.forEach((slot) => {
      if (slot.owner?.id && slot.owner?.name) {
        ownerMap.set(String(slot.owner.id), {
          id: String(slot.owner.id),
          name: slot.owner.name,
          email: slot.owner.email || '',
        });
      }
    });

    return [...ownerMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [publicSlots]);

  const filteredSlots = useMemo(() => {
    const onlyAvailable = publicSlots.filter((slot) => slot.isAvailable);

    if (!selectedOwnerId) {
      return onlyAvailable.sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );
    }

    return onlyAvailable
      .filter((slot) => String(slot.owner?.id) === String(selectedOwnerId))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [publicSlots, selectedOwnerId]);

  const selectedOwner = useMemo(() => {
    return availableOwners.find(
      (ownerItem) => String(ownerItem.id) === String(selectedOwnerId)
    ) || null;
  }, [availableOwners, selectedOwnerId]);

  const calendarEvents = useMemo(() => {
    return filteredSlots.map((slot) => ({
      id: String(slot.id),
      title: `${slot.title} (${slot.bookedCount || 0}/${slot.capacity || 1})`,
      start: slot.start,
      end: slot.end,
      extendedProps: {
        capacity: slot.capacity || 1,
        bookedCount: slot.bookedCount || 0,
        isAvailable: slot.isAvailable,
        ownerName: slot.owner?.name || '',
        ownerEmail: slot.owner?.email || '',
      },
    }));
  }, [filteredSlots]);

  const selectedSlot = useMemo(() => {
    return filteredSlots.find(
      (slot) => String(slot.id) === String(selectedSlotId)
    ) || null;
  }, [filteredSlots, selectedSlotId]);

  const handleOwnerChange = (event) => {
    const ownerId = event.target.value;
    setSelectedOwnerId(ownerId);
    setSelectedSlotId(null);
    setMessage('');
    setError('');
  };

  const handleReserveSlot = async (slotId) => {
    try {
      setMessage('');
      setError('');
      setReservingSlotId(slotId);

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('You must be logged in to reserve a Type 3 slot.');
      }

      const response = await fetch(`${API_BASE}/type3/slots/${slotId}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reserve Type 3 slot.');
      }

      setMessage('Type 3 slot reserved successfully.');

      setPublicSlots((current) =>
        current.map((slot) =>
          String(slot.id) === String(slotId) ? data.slot : slot
        )
      );

      if (String(selectedSlotId) === String(slotId)) {
        setSelectedSlotId(null);
      }
    } catch (reserveError) {
      console.error(reserveError);
      setError(reserveError.message || 'Unable to reserve Type 3 slot.');
    } finally {
      setReservingSlotId(null);
    }
  };

  const handleCalendarEventClick = (calendarEvent) => {
    setSelectedSlotId(calendarEvent.id);
    setMessage('');
    setError('');
  };

  return (
    <>
      <DashboardTopnav
        userEmail={user?.email || 'user@mail.mcgill.ca'}
        userName={user?.name || 'Student'}
        onLogout={onLogout}
      />

      {/* switch to other pages */}
      <div className="switch-buttons">
        <div className="inline-actions">
          {onOpenUserDashboard && (
            <button type="button" onClick={onOpenUserDashboard}>
              Back to User Dashboard
            </button>
          )}
          {onOpenType2Vote && (
            <button type="button" onClick={onOpenType2Vote}>
              Type 2 Vote
            </button>
          )}
        </div>
      </div>

      <main className="booking-page">
        <header className="booking-header">
          <h1>Available Type 3 Office Hours</h1>
          <p className="booking-subtitle">
            Select a professor first, then browse that professor’s available office-hour
            sessions and reserve one.
          </p>
        </header>

        {message && <p className="notice success">{message}</p>}
        {error && <p className="notice error">{error}</p>}

        <section className="booking-layout">
          <section className="card booking-form">
            <h2>Select Professor</h2>

            <label>
              Professor / Owner
              <select value={selectedOwnerId} onChange={handleOwnerChange}>
                <option value="">-- Select a professor --</option>
                {availableOwners.map((ownerItem) => (
                  <option key={ownerItem.id} value={ownerItem.id}>
                    {ownerItem.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedOwner ? (
              <div className="invitee-preview-box">
                <p className="summary-title">Selected Professor</p>
                <p>{selectedOwner.name}</p>
                <p>{selectedOwner.email}</p>
                <div className="inline-actions" style={{ marginTop: '12px' }}>
                  <a
                    className="button secondary"
                    href={createMailto(selectedOwner.email)}
                  >
                    Email Professor
                  </a>
                </div>
              </div>
            ) : (
              <p className="helper-text">
                Choose a professor to see only that professor’s available Type 3 office hours.
              </p>
            )}

            <div className="invitee-preview-box">
              <p className="summary-title">Current Filter</p>
              <p>
                {selectedOwner
                  ? `Showing available office hours for ${selectedOwner.name}.`
                  : 'No professor selected yet.'}
              </p>
            </div>
          </section>

          <section className="card booking-side-panel">
            <h2>Available Sessions</h2>

            {loading ? (
              <p>Loading public Type 3 sessions...</p>
            ) : !selectedOwnerId ? (
              <p>Please select a professor first.</p>
            ) : filteredSlots.length === 0 ? (
              <p>No available office-hour sessions for this professor.</p>
            ) : (
              <div className="summary-list summary-list-scroll">
                {filteredSlots.map((slot) => {
                  const isSelected = String(selectedSlotId) === String(slot.id);
                  const isFull = !slot.isAvailable;

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
                        <p>Professor: {slot.owner?.name || 'Unknown'}</p>
                        <p>Start: {formatReadableDateTime(slot.start)}</p>
                        <p>End: {formatReadableDateTime(slot.end)}</p>
                        <p>Reserved: {slot.bookedCount || 0} / {slot.capacity || 1}</p>
                        <p>Status: {isFull ? 'Full' : 'Available'}</p>
                      </div>

                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => handleReserveSlot(slot.id)}
                        disabled={isFull || reservingSlotId === slot.id}
                      >
                        {isFull
                          ? 'Full'
                          : reservingSlotId === slot.id
                            ? 'Reserving...'
                            : 'Reserve'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </section>

        <section className="card booking-side-panel" style={{ marginBottom: '24px' }}>
          <h2>Selected Session</h2>

          {!selectedSlot ? (
            <p>Select a session from the list or calendar.</p>
          ) : (
            <div className="summary-list">
              <div className="summary-item">
                <div className="summary-main">
                  <p className="summary-title">{selectedSlot.title}</p>
                  <p>Professor: {selectedSlot.owner?.name || 'Unknown'}</p>
                  <p>Professor Email: {selectedSlot.owner?.email || 'N/A'}</p>
                  <p>Start: {formatReadableDateTime(selectedSlot.start)}</p>
                  <p>End: {formatReadableDateTime(selectedSlot.end)}</p>
                  <p>Reserved: {selectedSlot.bookedCount || 0} / {selectedSlot.capacity || 1}</p>
                  <p>Status: {selectedSlot.isAvailable ? 'Available' : 'Full'}</p>
                </div>

                <button
                  type="button"
                  className="button secondary"
                  onClick={() => handleReserveSlot(selectedSlot.id)}
                  disabled={!selectedSlot.isAvailable || reservingSlotId === selectedSlot.id}
                >
                  {!selectedSlot.isAvailable
                    ? 'Full'
                    : reservingSlotId === selectedSlot.id
                      ? 'Reserving...'
                      : 'Reserve'}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="card calendar-section">
          <div className="calendar-section-header">
            <h2>Calendar View</h2>
            <p>
              After selecting a professor, only that professor’s available office hours
              are shown on the calendar.
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