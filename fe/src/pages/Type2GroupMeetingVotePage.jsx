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

function isSlotVotable(slot) {
  const startTime = new Date(slot?.start).getTime();
  if (Number.isNaN(startTime)) return false;
  return startTime > Date.now();
}

function Type2GroupMeetingVotePage({
  onLogout,
  user,
  onOpenUserDashboard,
  onOpenType2Results,
  onOpenType3Public,
}) {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [meetingDetail, setMeetingDetail] = useState(null);
  const [myVotes, setMyVotes] = useState({});
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchInvitations = async () => {
    try {
      setLoadingMeetings(true);
      setError('');

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setMeetings([]);
        return;
      }

      const response = await fetch(`${API_BASE}/type2/me/invitations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Type 2 invitations.');
      }

      setMeetings(data.meetings || []);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || 'Unable to load invited Type 2 meetings.');
      setMeetings([]);
    } finally {
      setLoadingMeetings(false);
    }
  };

  const fetchMeetingDetail = async (meetingId) => {
    try {
      setLoadingDetail(true);
      setError('');
      setMessage('');

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setMeetingDetail(null);
        return;
      }

      const [detailResponse, votesResponse] = await Promise.all([
        fetch(`${API_BASE}/type2/meetings/${meetingId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE}/type2/meetings/${meetingId}/my-votes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const detailData = await detailResponse.json().catch(() => ({}));
      const votesData = await votesResponse.json().catch(() => ({}));

      if (!detailResponse.ok) {
        throw new Error(detailData.error || 'Failed to fetch Type 2 meeting detail.');
      }

      if (!votesResponse.ok) {
        throw new Error(votesData.error || 'Failed to fetch your Type 2 votes.');
      }

      setMeetingDetail(detailData);

      const voteMap = {};
      (votesData.votes || []).forEach((vote) => {
        voteMap[String(vote.slotId)] = Boolean(vote.isAvailable);
      });
      setMyVotes(voteMap);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || 'Unable to load Type 2 meeting detail.');
      setMeetingDetail(null);
      setMyVotes({});
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    void fetchInvitations();
  }, [user]);

  const handleMeetingChange = async (event) => {
    const nextMeetingId = event.target.value;
    setSelectedMeetingId(nextMeetingId);
    setMeetingDetail(null);
    setMyVotes({});
    setMessage('');
    setError('');

    if (!nextMeetingId) {
      return;
    }

    await fetchMeetingDetail(nextMeetingId);
  };

  const handleVoteChange = (slot, isAvailable) => {
    if (!isSlotVotable(slot)) {
      setError('This slot is in the past and can no longer be voted on.');
      return;
    }

    setMyVotes((current) => ({
      ...current,
      [String(slot.id)]: isAvailable,
    }));
    setMessage('');
    setError('');
  };

  const handleSubmitVotes = async () => {
    if (!selectedMeetingId || !meetingDetail?.slots?.length) {
      setError('Please select a meeting first.');
      return;
    }

    const votableSlots = meetingDetail.slots.filter((slot) => isSlotVotable(slot));

    if (votableSlots.length === 0) {
      setError('All candidate slots are in the past. Voting is closed for this meeting.');
      return;
    }

    const allVotesFilled = votableSlots.every(
      (slot) => myVotes[String(slot.id)] === true || myVotes[String(slot.id)] === false
    );

    if (!allVotesFilled) {
      setError('Please choose Available or Unavailable for every future candidate slot.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setMessage('');

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('You must be logged in to submit votes.');
      }

      const votesPayload = votableSlots.map((slot) => ({
        slotId: slot.id,
        isAvailable: Boolean(myVotes[String(slot.id)]),
      }));

      const response = await fetch(`${API_BASE}/type2/meetings/${selectedMeetingId}/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          votes: votesPayload,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit Type 2 votes.');
      }

      setMessage('Your availability has been submitted successfully.');
    } catch (submitError) {
      console.error(submitError);
      setError(submitError.message || 'Unable to submit Type 2 votes.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMeeting = useMemo(() => {
    return meetings.find(
      (meeting) => String(meeting.id) === String(selectedMeetingId)
    ) || null;
  }, [meetings, selectedMeetingId]);

  const calendarEvents = useMemo(() => {
    if (!meetingDetail?.slots) return [];

    return meetingDetail.slots.map((slot) => {
      const voteValue = myVotes[String(slot.id)];
      const voteLabel =
        voteValue === true
          ? 'Available'
          : voteValue === false
            ? 'Unavailable'
            : 'Not answered';

      return {
        id: String(slot.id),
        title: `${selectedMeeting?.title || 'Meeting'} (${voteLabel})`,
        start: slot.start,
        end: slot.end,
      };
    });
  }, [meetingDetail, myVotes, selectedMeeting]);

  return (
    <>
      <DashboardTopnav
        userEmail={user?.email || 'user@mail.mcgill.ca'}
        userName={user?.name || 'Student'}
        onLogout={onLogout}
      />

      <div className="switch-buttons">
        <div className="inline-actions">
          {onOpenUserDashboard && (
            <button type="button" onClick={onOpenUserDashboard}>
              Back to User Dashboard
            </button>
          )}
          {onOpenType2Results && (
            <button type="button" onClick={onOpenType2Results}>
              Group Meeting Results
            </button>
          )}
          {onOpenType3Public && (
            <button type="button" onClick={onOpenType3Public}>
              Office Hour Public
            </button>
          )}
        </div>
      </div>

      <main className="booking-page">
        <header className="booking-header">
          <h1>Group Meeting Vote</h1>
          <p className="booking-subtitle">
            Select an invited group meeting, review the candidate slots, and submit your
            availability for each option.
          </p>
        </header>

        {message && <p className="notice success">{message}</p>}
        {error && <p className="notice error">{error}</p>}

        <section className="booking-layout">
          <section className="card booking-form">
            <h2>Select Invited Meeting</h2>

            {loadingMeetings ? (
              <p>Loading your invited meetings...</p>
            ) : meetings.length === 0 ? (
              <p>You do not have any Type 2 meeting invitations yet.</p>
            ) : (
              <label>
                Invited Meetings
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

            {selectedMeeting && (
              <div className="invitee-preview-box">
                <p className="summary-title">Meeting Information</p>
                <p><strong>Title:</strong> {selectedMeeting.title}</p>
                <p><strong>Status:</strong> {selectedMeeting.status}</p>
                <p><strong>Owner:</strong> {selectedMeeting.owner?.name || 'Unknown'}</p>
                <p><strong>Owner Email:</strong> {selectedMeeting.owner?.email || 'N/A'}</p>
                <p><strong>Description:</strong> {selectedMeeting.description || 'No description.'}</p>
              </div>
            )}
          </section>

          <section className="card booking-side-panel">
            <h2>Candidate Slots</h2>

            {loadingDetail ? (
              <p>Loading meeting details...</p>
            ) : !meetingDetail ? (
              <p>Please select a meeting first.</p>
            ) : !meetingDetail.slots?.length ? (
              <p>No candidate slots found for this meeting.</p>
            ) : (
              <div className="summary-list summary-list-scroll">
                {meetingDetail.slots.map((slot) => {
                  const currentVote = myVotes[String(slot.id)];
                  const locked = !isSlotVotable(slot);

                  return (
                    <div key={slot.id} className="summary-item">
                      <div className="summary-main">
                        <p className="summary-title">
                          {formatReadableDateTime(slot.start)}
                        </p>
                        <p>End: {formatReadableDateTime(slot.end)}</p>
                        <p>Status: {locked ? 'Voting closed (past slot)' : 'Open for voting'}</p>
                        <p>
                          Current choice:{' '}
                          {currentVote === true
                            ? 'Available'
                            : currentVote === false
                              ? 'Unavailable'
                              : 'Not answered'}
                        </p>
                      </div>

                      {/* <div className="inline-actions">
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => handleVoteChange(slot, true)}
                          disabled={locked}
                        >
                          Available
                        </button>
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => handleVoteChange(slot, false)}
                          disabled={locked}
                        >
                          Unavailable
                        </button>
                      </div> */}
                      <div className="inline-actions">
                        <button
                          type="button"
                          className={`vote-button ${
                            currentVote === true ? 'selected-available' : ''
                          }`}
                          onClick={() => handleVoteChange(slot, true)}
                          disabled={locked}
                        >
                          Available
                        </button>

                        <button
                          type="button"
                          className={`vote-button ${
                            currentVote === false ? 'selected-unavailable' : ''
                          }`}
                          onClick={() => handleVoteChange(slot, false)}
                          disabled={locked}
                        >
                          Unavailable
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </section>

        <section className="card booking-side-panel" style={{ marginBottom: '24px' }}>
          <h2>Submit Availability</h2>
          <p className="helper-text">
            Please answer every future candidate slot before submitting your Type 2 votes.
          </p>

          <div className="inline-actions">
            <button
              type="button"
              onClick={handleSubmitVotes}
              disabled={submitting || !meetingDetail}
            >
              {submitting ? 'Submitting...' : 'Submit Votes'}
            </button>
          </div>
        </section>

        <section className="card calendar-section">
          <div className="calendar-section-header">
            <h2>Calendar Preview</h2>
            <p>
              Candidate slots are shown on the calendar. The event titles reflect your
              current availability choice.
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

export default Type2GroupMeetingVotePage;