// /* Author: Hanjing Zheng */

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

// function Type2GroupMeetingResultsPage({
//   onLogout,
//   user,
//   onOpenDashboard,
//   onOpenType2Create,
// }) {
//   const [meetings, setMeetings] = useState([]);
//   const [selectedMeetingId, setSelectedMeetingId] = useState('');
//   const [resultsData, setResultsData] = useState(null);
//   const [loadingMeetings, setLoadingMeetings] = useState(true);
//   const [loadingResults, setLoadingResults] = useState(false);
//   const [message, setMessage] = useState('');
//   const [error, setError] = useState('');

//   const fetchMeetings = async () => {
//     try {
//       setLoadingMeetings(true);
//       setError('');

//       const token = localStorage.getItem(TOKEN_KEY);
//       if (!token) {
//         setMeetings([]);
//         return;
//       }

//       let response;
//       let data;

//       if (user?.role === 'owner') {
//         response = await fetch(`${API_BASE}/type2/owner/meetings`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });
//         data = await response.json().catch(() => ({}));
//       } else {
//         response = await fetch(`${API_BASE}/type2/me/invitations`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });
//         data = await response.json().catch(() => ({}));
//       }

//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to fetch Type 2 meetings.');
//       }

//       setMeetings(data.meetings || []);
//     } catch (fetchError) {
//       console.error(fetchError);
//       setError(fetchError.message || 'Unable to load Type 2 meetings.');
//       setMeetings([]);
//     } finally {
//       setLoadingMeetings(false);
//     }
//   };

//   const fetchMeetingResults = async (meetingId) => {
//     try {
//       setLoadingResults(true);
//       setError('');
//       setMessage('');

//       const token = localStorage.getItem(TOKEN_KEY);
//       if (!token) {
//         setResultsData(null);
//         return;
//       }

//       const response = await fetch(`${API_BASE}/type2/meetings/${meetingId}/results`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const data = await response.json().catch(() => ({}));

//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to fetch Type 2 results.');
//       }

//       setResultsData(data);
//     } catch (fetchError) {
//       console.error(fetchError);
//       setError(fetchError.message || 'Unable to load Type 2 results.');
//       setResultsData(null);
//     } finally {
//       setLoadingResults(false);
//     }
//   };

//   useEffect(() => {
//     void fetchMeetings();
//   }, [user]);

//   const handleMeetingChange = async (event) => {
//     const meetingId = event.target.value;
//     setSelectedMeetingId(meetingId);
//     setResultsData(null);
//     setMessage('');
//     setError('');

//     if (!meetingId) {
//       return;
//     }

//     await fetchMeetingResults(meetingId);
//   };

//   const selectedMeeting = useMemo(() => {
//     return meetings.find(
//       (meeting) => String(meeting.id) === String(selectedMeetingId)
//     ) || null;
//   }, [meetings, selectedMeetingId]);

//   const bestAvailableCount = useMemo(() => {
//     if (!resultsData?.results?.length) return 0;
//     return Math.max(...resultsData.results.map((item) => Number(item.availableCount || 0)));
//   }, [resultsData]);

//   const topResults = useMemo(() => {
//     if (!resultsData?.results?.length) return [];
//     return resultsData.results.filter(
//       (item) => Number(item.availableCount || 0) === bestAvailableCount
//     );
//   }, [resultsData, bestAvailableCount]);

//   const calendarEvents = useMemo(() => {
//     if (!resultsData?.results) return [];

//     return resultsData.results.map((item, index) => ({
//       id: String(item.slot.id),
//       title: `${selectedMeeting?.title || 'Meeting'} - Option ${index + 1} (${item.availableCount} available)`,
//       start: item.slot.start,
//       end: item.slot.end,
//       extendedProps: {
//         availableCount: item.availableCount,
//       },
//     }));
//   }, [resultsData, selectedMeeting]);

//   const voteDetailsBySlot = useMemo(() => {
//     if (!resultsData?.voteDetails) return {};

//     return resultsData.voteDetails.reduce((acc, detail) => {
//       const slotId = String(detail.slotId);
//       if (!acc[slotId]) {
//         acc[slotId] = [];
//       }
//       acc[slotId].push(detail);
//       return acc;
//     }, {});
//   }, [resultsData]);

//   return (
//     <>
//       <DashboardTopnav
//         userEmail={user?.email || 'user@mcgill.ca'}
//         userName={user?.name || 'User'}
//         onLogout={onLogout}
//       />

//       <div className="switch-buttons">
//         <div className="inline-actions">
//           {onOpenDashboard && (
//             <button type="button" onClick={onOpenDashboard}>
//               Back to Dashboard
//             </button>
//           )}
//           {user?.role === 'owner' && onOpenType2Create && (
//             <button type="button" onClick={onOpenType2Create}>
//               Type 2 Create
//             </button>
//           )}
//         </div>
//       </div>

//       <main className="booking-page">
//         <header className="booking-header">
//           <h1>Type 2 Group Meeting Results</h1>
//           <p className="booking-subtitle">
//             Select a Type 2 meeting to view vote totals and the best candidate time slot.
//           </p>
//         </header>

//         {message && <p className="notice success">{message}</p>}
//         {error && <p className="notice error">{error}</p>}

//         <section className="booking-layout">
//           <section className="card booking-form">
//             <h2>Select Meeting</h2>

//             {loadingMeetings ? (
//               <p>Loading Type 2 meetings...</p>
//             ) : meetings.length === 0 ? (
//               <p>No Type 2 meetings found.</p>
//             ) : (
//               <label>
//                 Meetings
//                 <select value={selectedMeetingId} onChange={handleMeetingChange}>
//                   <option value="">-- Select a Type 2 meeting --</option>
//                   {meetings.map((meeting) => (
//                     <option key={meeting.id} value={meeting.id}>
//                       {meeting.title}
//                     </option>
//                   ))}
//                 </select>
//               </label>
//             )}

//             {selectedMeeting && (
//               <div className="invitee-preview-box">
//                 <p className="summary-title">Meeting Information</p>
//                 <p><strong>Title:</strong> {selectedMeeting.title}</p>
//                 <p><strong>Status:</strong> {selectedMeeting.status}</p>
//                 <p><strong>Description:</strong> {selectedMeeting.description || 'No description.'}</p>
//                 <p><strong>Owner:</strong> {selectedMeeting.owner?.name || 'Unknown'}</p>
//                 <p><strong>Owner Email:</strong> {selectedMeeting.owner?.email || 'N/A'}</p>
//               </div>
//             )}

//             <div className="invitee-preview-box">
//               <p className="summary-title">Best Option Summary</p>
//               {!resultsData?.results?.length ? (
//                 <p>Select a meeting to see the best option.</p>
//               ) : (
//                 <>
//                   <p>Highest availability count: {bestAvailableCount}</p>
//                   <p>Top candidate slot(s): {topResults.length}</p>
//                 </>
//               )}
//             </div>
//           </section>

//           <section className="card booking-side-panel">
//             <h2>Ranked Candidate Slots</h2>

//             {loadingResults ? (
//               <p>Loading meeting results...</p>
//             ) : !resultsData ? (
//               <p>Please select a meeting first.</p>
//             ) : !resultsData.results?.length ? (
//               <p>No candidate slot results found.</p>
//             ) : (
//               <div className="summary-list summary-list-scroll">
//                 {resultsData.results.map((item, index) => {
//                   const isTop = Number(item.availableCount || 0) === bestAvailableCount;

//                   return (
//                     <div
//                       key={item.slot.id}
//                       className={`summary-item ${isTop ? 'selected-summary-item' : ''}`}
//                     >
//                       <div className="summary-main">
//                         <p className="summary-title">
//                           Option {index + 1} {isTop ? '(Best)' : ''}
//                         </p>
//                         <p>Start: {formatReadableDateTime(item.slot.start)}</p>
//                         <p>End: {formatReadableDateTime(item.slot.end)}</p>
//                         <p>Available votes: {item.availableCount}</p>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </section>
//         </section>

//         <section className="card booking-side-panel" style={{ marginBottom: '24px' }}>
//           <h2>Vote Details</h2>

//           {loadingResults ? (
//             <p>Loading vote details...</p>
//           ) : !resultsData?.results?.length ? (
//             <p>Select a meeting to see vote details.</p>
//           ) : (
//             <div className="summary-list summary-list-scroll">
//               {resultsData.results.map((item, index) => {
//                 const slotId = String(item.slot.id);
//                 const slotVotes = voteDetailsBySlot[slotId] || [];

//                 return (
//                   <div key={slotId} className="summary-item">
//                     <div className="summary-main">
//                       <p className="summary-title">Option {index + 1}</p>
//                       <p>{formatReadableDateTime(item.slot.start)} — {formatReadableDateTime(item.slot.end)}</p>

//                       {slotVotes.length === 0 ? (
//                         <p>No votes submitted yet.</p>
//                       ) : (
//                         <ul className="invitee-list">
//                           {slotVotes.map((detail) => (
//                             <li key={`${detail.slotId}-${detail.userId}`}>
//                               {detail.name} ({detail.email}) — {detail.isAvailable ? 'Available' : 'Unavailable'}
//                             </li>
//                           ))}
//                         </ul>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </section>

//         <section className="card calendar-section">
//           <div className="calendar-section-header">
//             <h2>Calendar View</h2>
//             <p>
//               Candidate slots are shown on the calendar with their availability counts.
//             </p>
//           </div>

//           <CalendarGrid
//             mode="readonly"
//             events={calendarEvents}
//           />
//         </section>
//       </main>
//     </>
//   );
// }

// export default Type2GroupMeetingResultsPage;


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

function Type2GroupMeetingResultsPage({
  onLogout,
  user,
  onOpenDashboard,
  onOpenType2Create,
}) {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [resultsData, setResultsData] = useState(null);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchMeetings = async () => {
    try {
      setLoadingMeetings(true);
      setError('');

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setMeetings([]);
        return;
      }

      let response;
      let data;

      if (user?.role === 'owner') {
        response = await fetch(`${API_BASE}/type2/owner/meetings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        data = await response.json().catch(() => ({}));
      } else {
        response = await fetch(`${API_BASE}/type2/me/invitations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        data = await response.json().catch(() => ({}));
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Type 2 meetings.');
      }

      setMeetings(data.meetings || []);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || 'Unable to load Type 2 meetings.');
      setMeetings([]);
    } finally {
      setLoadingMeetings(false);
    }
  };

  const fetchMeetingResults = async (meetingId) => {
    try {
      setLoadingResults(true);
      setError('');
      setMessage('');

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setResultsData(null);
        return;
      }

      const response = await fetch(`${API_BASE}/type2/meetings/${meetingId}/results`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Type 2 results.');
      }

      setResultsData(data);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || 'Unable to load Type 2 results.');
      setResultsData(null);
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    void fetchMeetings();
  }, [user]);

  const handleMeetingChange = async (event) => {
    const meetingId = event.target.value;
    setSelectedMeetingId(meetingId);
    setResultsData(null);
    setMessage('');
    setError('');

    if (!meetingId) {
      return;
    }

    await fetchMeetingResults(meetingId);
  };

  const selectedMeeting = useMemo(() => {
    return meetings.find(
      (meeting) => String(meeting.id) === String(selectedMeetingId)
    ) || null;
  }, [meetings, selectedMeetingId]);

  const bestAvailableCount = useMemo(() => {
    if (!resultsData?.results?.length) return 0;
    return Math.max(...resultsData.results.map((item) => Number(item.availableCount || 0)));
  }, [resultsData]);

  const topResults = useMemo(() => {
    if (!resultsData?.results?.length) return [];
    return resultsData.results.filter(
      (item) => Number(item.availableCount || 0) === bestAvailableCount
    );
  }, [resultsData, bestAvailableCount]);

  const calendarEvents = useMemo(() => {
    if (!resultsData?.results) return [];

    return resultsData.results.map((item, index) => ({
      id: String(item.slot.id),
      title: `${selectedMeeting?.title || 'Meeting'} - Option ${index + 1} (${item.availableCount} available)`,
      start: item.slot.start,
      end: item.slot.end,
      extendedProps: {
        availableCount: item.availableCount,
      },
    }));
  }, [resultsData, selectedMeeting]);

  const voteDetailsBySlot = useMemo(() => {
    if (!resultsData?.voteDetails) return {};

    return resultsData.voteDetails.reduce((acc, detail) => {
      const slotId = String(detail.slotId);
      if (!acc[slotId]) {
        acc[slotId] = [];
      }
      acc[slotId].push(detail);
      return acc;
    }, {});
  }, [resultsData]);

  return (
    <>
      <DashboardTopnav
        userEmail={user?.email || 'user@mcgill.ca'}
        userName={user?.name || 'User'}
        onLogout={onLogout}
      />

      <div className="switch-buttons">
        <div className="inline-actions">
          {onOpenDashboard && (
            <button type="button" onClick={onOpenDashboard}>
              Back to Dashboard
            </button>
          )}
          {user?.role === 'owner' && onOpenType2Create && (
            <button type="button" onClick={onOpenType2Create}>
              Type 2 Create
            </button>
          )}
        </div>
      </div>

      <main className="booking-page">
        <header className="booking-header">
          <h1>Type 2 Group Meeting Results</h1>
          <p className="booking-subtitle">
            Select a Type 2 meeting to view vote totals and the best candidate time slot.
          </p>
        </header>

        {message && <p className="notice success">{message}</p>}
        {error && <p className="notice error">{error}</p>}

        <section className="booking-layout">
          <section className="card booking-form">
            <h2>Select Meeting</h2>

            {loadingMeetings ? (
              <p>Loading Type 2 meetings...</p>
            ) : meetings.length === 0 ? (
              <p>No Type 2 meetings found.</p>
            ) : (
              <label>
                Meetings
                <select value={selectedMeetingId} onChange={handleMeetingChange}>
                  <option value="">-- Select a Type 2 meeting --</option>
                  {meetings.map((meeting) => (
                    <option key={meeting.id} value={meeting.id}>
                      {meeting.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {selectedMeeting && (
              <div className="invitee-preview-box">
                <p className="summary-title">Meeting Information</p>
                <p><strong>Title:</strong> {selectedMeeting.title}</p>
                <p><strong>Status:</strong> {selectedMeeting.status}</p>
                <p><strong>Description:</strong> {selectedMeeting.description || 'No description.'}</p>
                <p><strong>Owner:</strong> {selectedMeeting.owner?.name || 'Unknown'}</p>
                <p><strong>Owner Email:</strong> {selectedMeeting.owner?.email || 'N/A'}</p>
              </div>
            )}

            <div className="invitee-preview-box">
              <p className="summary-title">Best Option Summary</p>
              {!resultsData?.results?.length ? (
                <p>Select a meeting to see the best option.</p>
              ) : (
                <>
                  <p>Highest availability count: {bestAvailableCount}</p>
                  <p>Top candidate slot(s): {topResults.length}</p>
                </>
              )}
            </div>
          </section>

          <section className="card booking-side-panel">
            <h2>Ranked Candidate Slots</h2>

            {loadingResults ? (
              <p>Loading meeting results...</p>
            ) : !resultsData ? (
              <p>Please select a meeting first.</p>
            ) : !resultsData.results?.length ? (
              <p>No candidate slot results found.</p>
            ) : (
              <div className="summary-list summary-list-scroll">
                {resultsData.results.map((item, index) => {
                  const isTop = Number(item.availableCount || 0) === bestAvailableCount;

                  return (
                    <div
                      key={item.slot.id}
                      className={`summary-item ${isTop ? 'selected-summary-item' : ''}`}
                    >
                      <div className="summary-main">
                        <p className="summary-title">
                          Option {index + 1} {isTop ? '(Best)' : ''}
                        </p>
                        <p>Start: {formatReadableDateTime(item.slot.start)}</p>
                        <p>End: {formatReadableDateTime(item.slot.end)}</p>
                        <p>Available votes: {item.availableCount}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </section>

        <section className="card booking-side-panel" style={{ marginBottom: '24px' }}>
          <h2>Vote Details</h2>

          {loadingResults ? (
            <p>Loading vote details...</p>
          ) : !resultsData?.results?.length ? (
            <p>Select a meeting to see vote details.</p>
          ) : (
            <div className="summary-list summary-list-scroll">
              {resultsData.results.map((item, index) => {
                const slotId = String(item.slot.id);
                const slotVotes = voteDetailsBySlot[slotId] || [];

                return (
                  <div key={slotId} className="summary-item">
                    <div className="summary-main">
                      <p className="summary-title">Option {index + 1}</p>
                      <p>{formatReadableDateTime(item.slot.start)} — {formatReadableDateTime(item.slot.end)}</p>

                      {slotVotes.length === 0 ? (
                        <p>No votes submitted yet.</p>
                      ) : (
                        <ul className="invitee-list">
                          {slotVotes.map((detail) => (
                            <li key={`${detail.slotId}-${detail.userId}`}>
                              {detail.name} ({detail.email}) — {detail.isAvailable ? 'Available' : 'Unavailable'}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="card calendar-section">
          <div className="calendar-section-header">
            <h2>Calendar View</h2>
            <p>
              Candidate slots are shown on the calendar with their availability counts.
            </p>
          </div>

          <CalendarGrid
            mode="readonly"
            events={calendarEvents}
          />
        </section>
      </main>
    </>
  );
}

export default Type2GroupMeetingResultsPage;