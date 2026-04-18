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

function isSlotEditable(slot) {
  const startTime = new Date(slot?.start).getTime();
  if (Number.isNaN(startTime)) return false;
  return startTime > Date.now();
}

function Type2OwnerGroupMeetingResultsPage({
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
  const [savingFinalSlotId, setSavingFinalSlotId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchOwnerMeetings = async () => {
    try {
      setLoadingMeetings(true);
      setError('');

      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/type2/owner/meetings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Type 2 meetings.');
      }

      setMeetings(data.meetings || []);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || 'Unable to load meetings.');
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
      const response = await fetch(`${API_BASE}/type2/meetings/${meetingId}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Type 2 results.');
      }

      setResultsData(data);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || 'Unable to load results.');
      setResultsData(null);
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    void fetchOwnerMeetings();
  }, [user]);

  const handleMeetingChange = async (event) => {
    const meetingId = event.target.value;
    setSelectedMeetingId(meetingId);
    setResultsData(null);
    setMessage('');
    setError('');

    if (meetingId) {
      await fetchMeetingResults(meetingId);
    }
  };

  const bestAvailableCount = useMemo(() => {
    if (!resultsData?.results?.length) return 0;
    return Math.max(...resultsData.results.map((item) => Number(item.availableCount || 0)));
  }, [resultsData]);

  const selectedFinalSlotId = useMemo(() => {
    return resultsData?.finalSlot?.id || resultsData?.meeting?.finalSlotId || null;
  }, [resultsData]);

  const calendarEvents = useMemo(() => {
    if (!resultsData?.results) return [];

    return resultsData.results.map((item, index) => {
      const isFinal = Number(selectedFinalSlotId) === Number(item.slot.id);

      return {
        id: String(item.slot.id),
        title: isFinal
          ? `Final Choice - Option ${index + 1}`
          : `Option ${index + 1} (${item.availableCount} available)`,
        start: item.slot.start,
        end: item.slot.end,
      };
    });
  }, [resultsData, selectedFinalSlotId]);

  const handleChooseFinalTime = async (slotId) => {
    try {
      setSavingFinalSlotId(slotId);
      setError('');
      setMessage('');

      const targetSlot = resultsData?.results?.find(
        (item) => Number(item.slot.id) === Number(slotId)
      )?.slot;
      if (!targetSlot || !isSlotEditable(targetSlot)) {
        throw new Error('This slot is in the past and cannot be changed.');
      }

      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(
        `${API_BASE}/type2/meetings/${selectedMeetingId}/final-slot`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ slotId }),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to choose final time.');
      }

      setMessage('Final meeting time selected successfully.');
      await fetchOwnerMeetings();
      await fetchMeetingResults(selectedMeetingId);
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message || 'Unable to choose final meeting time.');
    } finally {
      setSavingFinalSlotId(null);
    }
  };

  const handleClearFinalTime = async () => {
    try {
      setSavingFinalSlotId('clear');
      setError('');
      setMessage('');

      const selectedFinalSlot = resultsData?.results?.find(
        (item) => Number(item.slot.id) === Number(selectedFinalSlotId)
      )?.slot;
      if (!selectedFinalSlot || !isSlotEditable(selectedFinalSlot)) {
        throw new Error('The selected final slot is in the past and cannot be changed.');
      }

      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(
        `${API_BASE}/type2/meetings/${selectedMeetingId}/final-slot`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ slotId: null }),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear final time.');
      }

      setMessage('Final meeting time cleared successfully.');
      await fetchOwnerMeetings();
      await fetchMeetingResults(selectedMeetingId);
    } catch (clearError) {
      console.error(clearError);
      setError(clearError.message || 'Unable to clear final meeting time.');
    } finally {
      setSavingFinalSlotId(null);
    }
  };

  return (
    <>
      <DashboardTopnav
        userEmail={user?.email || 'owner@mcgill.ca'}
        userName={user?.name || 'Owner'}
        onLogout={onLogout}
      />

      <div className="switch-buttons">
        <div className="inline-actions">
          {onOpenDashboard && <button onClick={onOpenDashboard}>Back to Dashboard</button>}
          {onOpenType2Create && <button onClick={onOpenType2Create}>Create Group Meetings</button>}
        </div>
      </div>

      <main className="booking-page">
        <header className="booking-header">
          <h1>Group Meeting Results</h1>
          <p className="booking-subtitle">
            Review votes and choose the final meeting time.
          </p>
        </header>

        {message && <p className="notice success">{message}</p>}
        {error && <p className="notice error">{error}</p>}

        <section className="booking-layout">
          <section className="card booking-form">
            <h2>Select Meeting</h2>

            {loadingMeetings ? (
              <p>Loading meetings...</p>
            ) : (
              <label>
                Meetings
                <select value={selectedMeetingId} onChange={handleMeetingChange}>
                  <option value="">-- Select a meeting --</option>
                  {meetings.map((meeting) => (
                    <option key={meeting.id} value={meeting.id}>
                      {meeting.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {resultsData?.meeting && (
              <div className="invitee-preview-box" style={{ marginTop: '16px' }}>
                <p className="summary-title">Meeting Information</p>
                <p><strong>Title:</strong> {resultsData.meeting.title}</p>
                <p><strong>Status:</strong> {resultsData.meeting.status}</p>
                <p><strong>Description:</strong> {resultsData.meeting.description || 'No description.'}</p>
                {selectedFinalSlotId ? (
                  <p><strong>Final time selected:</strong> Yes</p>
                ) : (
                  <p><strong>Final time selected:</strong> No</p>
                )}
              </div>
            )}
          </section>

          <section className="card booking-side-panel">
            <h2>Candidate Slots</h2>

            {loadingResults ? (
              <p>Loading results...</p>
            ) : !resultsData?.results?.length ? (
              <p>Select a meeting to see results.</p>
            ) : (
              <div className="summary-list summary-list-scroll">
                {resultsData.results.map((item, index) => {
                  const isBest = Number(item.availableCount || 0) === bestAvailableCount;
                  const isSelectedFinal = Number(selectedFinalSlotId) === Number(item.slot.id);
                  const hasAnyFinal = selectedFinalSlotId !== null;
                  const isPastLocked = !isSlotEditable(item.slot);

                  return (
                    <div
                      key={item.slot.id}
                      className={`summary-item ${isBest ? 'selected-summary-item' : ''} ${isSelectedFinal ? 'final-selected-slot' : ''}`}
                    >
                      <div className="summary-main">
                        <p className="summary-title">
                          Option {index + 1} {isBest ? '(Best)' : ''}
                        </p>

                        {isSelectedFinal && (
                          <p className="final-choice-badge">Final Choice</p>
                        )}

                        <p>Start: {formatReadableDateTime(item.slot.start)}</p>
                        <p>End: {formatReadableDateTime(item.slot.end)}</p>
                        <p>Available votes: {item.availableCount}</p>
                        <p>Status: {isPastLocked ? 'Locked (past slot)' : 'Open'}</p>
                      </div>

                      {isSelectedFinal ? (
                        <button
                          type="button"
                          className="button secondary"
                          disabled={savingFinalSlotId === 'clear' || isPastLocked}
                          onClick={handleClearFinalTime}
                        >
                          {savingFinalSlotId === 'clear'
                            ? 'Clearing...'
                            : isPastLocked
                              ? 'Locked'
                              : 'Unselect'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="button secondary"
                          disabled={savingFinalSlotId === item.slot.id || isPastLocked}
                          onClick={() => handleChooseFinalTime(item.slot.id)}
                        >
                          {savingFinalSlotId === item.slot.id
                            ? 'Saving...'
                            : isPastLocked
                              ? 'Locked'
                              : hasAnyFinal
                                ? 'Change To This Time'
                                : 'Choose Final Time'}
                        </button>
                      )}
                    </div>
                  );
                })}
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

export default Type2OwnerGroupMeetingResultsPage;