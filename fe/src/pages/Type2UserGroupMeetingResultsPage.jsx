/* Author: Hanjing Zheng */

import { API_BASE, TOKEN_KEY } from '../config';
import { useEffect, useMemo, useState } from 'react';
import './SchedulerPages.css';
import './switchButton.css';
import DashboardTopnav from '../components/DashboardTopnav';
import CalendarGrid from '../components/CalendarGrid';

function formatReadableDateTime(dateInput) {
  const date = new Date(dateInput);
  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function Type2UserGroupMeetingResultsPage({
  onLogout,
  user,
  onOpenDashboard,
  onOpenType2Vote,
}) {
  const [meetings, setMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [error, setError] = useState('');

  const fetchFinalizedMeetings = async () => {
    try {
      setLoadingMeetings(true);
      setError('');

      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/type2/me/finalized-meetings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch finalized meetings.');
      }

      setMeetings(data.meetings || []);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || 'Unable to load finalized meetings.');
      setMeetings([]);
    } finally {
      setLoadingMeetings(false);
    }
  };

  useEffect(() => {
    void fetchFinalizedMeetings();
  }, [user]);

  const selectedMeeting = useMemo(() => {
    return meetings.find((meeting) => String(meeting.id) === String(selectedMeetingId)) || null;
  }, [meetings, selectedMeetingId]);

  const calendarEvents = useMemo(() => {
    if (!selectedMeeting?.finalSlot) return [];
    return [
      {
        id: String(selectedMeeting.finalSlot.id),
        title: selectedMeeting.title,
        start: selectedMeeting.finalSlot.start,
        end: selectedMeeting.finalSlot.end,
      },
    ];
  }, [selectedMeeting]);

  return (
    <>
      <DashboardTopnav
        userEmail={user?.email || 'user@mail.mcgill.ca'}
        userName={user?.name || 'User'}
        onLogout={onLogout}
      />

      <div className="switch-buttons">
        <div className="inline-actions">
          {onOpenDashboard && <button onClick={onOpenDashboard}>Back to Dashboard</button>}
          {onOpenType2Vote && <button onClick={onOpenType2Vote}>Group Meeting Vote</button>}
        </div>
      </div>

      <main className="booking-page">
        <header className="booking-header">
          <h1>User Results</h1>
          <p className="booking-subtitle">
            View finalized group meetings and their decided meeting time.
          </p>
        </header>

        {error && <p className="notice error">{error}</p>}

        <section className="booking-layout">
          <section className="card booking-form">
            <h2>Finalized Meetings</h2>

            {loadingMeetings ? (
              <p>Loading finalized meetings...</p>
            ) : meetings.length === 0 ? (
              <p>No finalized group meetings yet.</p>
            ) : (
              <label>
                Meetings
                <select
                  value={selectedMeetingId}
                  onChange={(event) => setSelectedMeetingId(event.target.value)}
                >
                  <option value="">-- Select a finalized meeting --</option>
                  {meetings.map((meeting) => (
                    <option key={meeting.id} value={meeting.id}>
                      {meeting.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </section>

          <section className="card booking-side-panel">
            <h2>Final Meeting Time</h2>

            {!selectedMeeting ? (
              <p>Select a finalized meeting to view its decided time.</p>
            ) : (
              <div className="summary-list">
                <div className="summary-item">
                  <div className="summary-main">
                    <p className="summary-title">{selectedMeeting.title}</p>
                    <p>{selectedMeeting.description || 'No description.'}</p>
                    <p>Owner: {selectedMeeting.owner?.name}</p>
                    <p>Owner Email: {selectedMeeting.owner?.email}</p>
                    <p>Start: {formatReadableDateTime(selectedMeeting.finalSlot.start)}</p>
                    <p>End: {formatReadableDateTime(selectedMeeting.finalSlot.end)}</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </section>

        <section className="card calendar-section">
          <div className="calendar-section-header">
            <h2>Calendar View</h2>
          </div>

          <CalendarGrid mode="readonly" events={calendarEvents} />
        </section>
      </main>
    </>
  );
}

export default Type2UserGroupMeetingResultsPage;