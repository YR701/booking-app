/* Author: Hanjing Zheng */

import { API_BASE, TOKEN_KEY } from '../config';
import { useEffect, useMemo, useState } from 'react';
import './SchedulerPages.css';
import UserCalendarTopnav from '../components/CalendarTopnav';
import CalendarGrid from '../components/CalendarGrid';

function toDateTimeLocalValue(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function formatReadableDateTime(dateInput) {
  const date = new Date(dateInput);
  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function parseInvitees(inviteesText) {
  return inviteesText
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

function isValidMcGillEmail(email) {
  const safeEmail = String(email || '').trim().toLowerCase();
  return safeEmail.endsWith('@mail.mcgill.ca') || safeEmail.endsWith('@mcgill.ca');
}

function Type2CreateGroupMeetingPage({
  onBack,
  onLogout,
  user,
  type2Draft,
  setType2Draft,
}) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [loadingSavedMeetings, setLoadingSavedMeetings] = useState(true);
  const [savedMeetings, setSavedMeetings] = useState([]);
  const [savedMeetingDetails, setSavedMeetingDetails] = useState({});
  const [expandedMeetingId, setExpandedMeetingId] = useState(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState(null);
  const [editingSavedMeetingId, setEditingSavedMeetingId] = useState(null);
  const [updatingMeetingId, setUpdatingMeetingId] = useState(null);

  const [savedMeetingInviteeInputs, setSavedMeetingInviteeInputs] = useState({});
  const [savedMeetingSlotInputs, setSavedMeetingSlotInputs] = useState({});
  const [savedMeetingEditForms, setSavedMeetingEditForms] = useState({});

  const inviteeList = useMemo(() => {
    return parseInvitees(type2Draft.invitees);
  }, [type2Draft.invitees]);

  const sortedCandidateSlots = useMemo(() => {
    return [...type2Draft.candidateSlots].sort((a, b) => {
      const aTime = a.start ? new Date(a.start).getTime() : 0;
      const bTime = b.start ? new Date(b.start).getTime() : 0;
      return aTime - bTime;
    });
  }, [type2Draft.candidateSlots]);

  const calendarEvents = useMemo(() => {
    return type2Draft.candidateSlots
      .filter((slot) => slot.start && slot.end)
      .map((slot, index) => ({
        id: String(slot.id),
        title: `${type2Draft.title?.trim() || 'Group Meeting'} - Option ${index + 1}`,
        start: new Date(slot.start),
        end: new Date(slot.end),
        extendedProps: {
          candidateSlotId: slot.id,
        },
      }));
  }, [type2Draft.candidateSlots, type2Draft.title]);

  const resetDraft = () => {
    setType2Draft({
      title: 'COMP 307 Group Meeting',
      description: '',
      invitees: '',
      candidateSlots: [
        {
          id: `candidate-${Date.now()}`,
          start: '',
          end: '',
        },
      ],
    });
    setSelectedCandidateId(null);
  };

  const fetchOwnerMeetings = async () => {
    try {
      setLoadingSavedMeetings(true);

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setSavedMeetings([]);
        return;
      }

      const response = await fetch(`${API_BASE}/type2/owner/meetings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch saved Type 2 meetings.');
      }

      setSavedMeetings(data.meetings || []);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || 'Unable to load saved Type 2 meetings.');
      setSavedMeetings([]);
    } finally {
      setLoadingSavedMeetings(false);
    }
  };

  const fetchMeetingDetail = async (meetingId) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      const response = await fetch(`${API_BASE}/type2/meetings/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Type 2 meeting detail.');
      }

      setSavedMeetingDetails((current) => ({
        ...current,
        [meetingId]: data,
      }));

      setSavedMeetingEditForms((current) => ({
        ...current,
        [meetingId]: {
          title: data.meeting?.title || '',
          description: data.meeting?.description || '',
        },
      }));
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || 'Unable to load Type 2 meeting detail.');
    }
  };

  useEffect(() => {
    void fetchOwnerMeetings();
  }, [user]);

  const handleDraftChange = (event) => {
    const { name, value } = event.target;
    setType2Draft((current) => ({
      ...current,
      [name]: value,
    }));
    setMessage('');
    setError('');
  };

  const handleCandidateSlotChange = (slotId, field, value) => {
    setType2Draft((current) => ({
      ...current,
      candidateSlots: current.candidateSlots.map((slot) =>
        slot.id === slotId ? { ...slot, [field]: value } : slot
      ),
    }));
    setMessage('');
    setError('');
  };

  const handleAddCandidateSlot = () => {
    setType2Draft((current) => ({
      ...current,
      candidateSlots: [
        ...current.candidateSlots,
        {
          id: `candidate-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          start: '',
          end: '',
        },
      ],
    }));
    setMessage('');
    setError('');
  };

  const handleRemoveCandidateSlot = (slotId) => {
    setType2Draft((current) => {
      const updated = current.candidateSlots.filter((slot) => slot.id !== slotId);
      return {
        ...current,
        candidateSlots:
          updated.length > 0
            ? updated
            : [
                {
                  id: `candidate-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  start: '',
                  end: '',
                },
              ],
      };
    });

    if (selectedCandidateId === slotId) {
      setSelectedCandidateId(null);
    }

    setMessage('');
    setError('');
  };

  const handleCalendarSelect = ({ start, end }) => {
    if (!selectedCandidateId) {
      setError('Please click one candidate slot row on the left first, then select the time on the calendar.');
      return;
    }

    setType2Draft((current) => ({
      ...current,
      candidateSlots: current.candidateSlots.map((slot) =>
        slot.id === selectedCandidateId
          ? {
              ...slot,
              start: toDateTimeLocalValue(start),
              end: toDateTimeLocalValue(end),
            }
          : slot
      ),
    }));

    setMessage('');
    setError('');
  };

  const handleCalendarEventClick = (calendarEvent) => {
    const candidateSlotId = calendarEvent.extendedProps?.candidateSlotId;
    if (!candidateSlotId) return;
    setSelectedCandidateId(candidateSlotId);
    setMessage('');
    setError('');
  };

  const validateInvitees = (invitees) => {
    if (!invitees || invitees.length === 0) {
      return 'Please add at least one invited user email.';
    }

    const invalidInvitee = invitees.find((email) => !isValidMcGillEmail(email));
    if (invalidInvitee) {
      return `Invalid McGill email: ${invalidInvitee}`;
    }

    return '';
  };

  const validateCandidateSlots = (candidateSlots) => {
    if (!candidateSlots.length) {
      return 'Please add at least one candidate slot.';
    }

    for (const slot of candidateSlots) {
      if (!slot.start || !slot.end) {
        return 'Each candidate slot must have both start and end date/time.';
      }

      const start = new Date(slot.start);
      const end = new Date(slot.end);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return 'Each candidate slot must have valid date/time values.';
      }

      if (end <= start) {
        return 'Each candidate slot must end after it starts.';
      }
    }

    const seen = new Set();
    for (const slot of candidateSlots) {
      const key = `${new Date(slot.start).getTime()}-${new Date(slot.end).getTime()}`;
      if (seen.has(key)) {
        return 'Duplicate candidate slots are not allowed.';
      }
      seen.add(key);
    }

    return '';
  };

  const handleSaveGroupMeeting = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const inviteesValidationMessage = validateInvitees(inviteeList);
    if (inviteesValidationMessage) {
      setError(inviteesValidationMessage);
      return;
    }

    const candidateValidationMessage = validateCandidateSlots(type2Draft.candidateSlots);
    if (candidateValidationMessage) {
      setError(candidateValidationMessage);
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('You must be logged in to save a Type 2 meeting.');
      }

      const response = await fetch(`${API_BASE}/type2/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: type2Draft.title,
          description: type2Draft.description,
          slots: type2Draft.candidateSlots.map((slot) => ({
            start: new Date(slot.start).toISOString(),
            end: new Date(slot.end).toISOString(),
          })),
          inviteeEmails: [...inviteeList],
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save Type 2 meeting.');
      }

      setMessage('Group meeting saved successfully.');
      resetDraft();
      await fetchOwnerMeetings();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message || 'Unable to save Type 2 meeting.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSavedMeeting = async (meetingId) => {
    const isSameMeeting = String(expandedMeetingId) === String(meetingId);

    if (isSameMeeting) {
      setExpandedMeetingId(null);
      setEditingSavedMeetingId(null);
      return;
    }

    setExpandedMeetingId(meetingId);
    setEditingSavedMeetingId(null);

    if (!savedMeetingDetails[meetingId]) {
      await fetchMeetingDetail(meetingId);
    }
  };

  const handleEditSavedMeeting = async (meetingId) => {
    const isSameMeeting = String(editingSavedMeetingId) === String(meetingId);

    if (isSameMeeting) {
      setEditingSavedMeetingId(null);
      setExpandedMeetingId(null);
      return;
    }

    setEditingSavedMeetingId(meetingId);
    setExpandedMeetingId(meetingId);

    if (!savedMeetingDetails[meetingId]) {
      await fetchMeetingDetail(meetingId);
    }
  };

  const handleSavedMeetingEditFieldChange = (meetingId, field, value) => {
    setSavedMeetingEditForms((current) => ({
      ...current,
      [meetingId]: {
        ...(current[meetingId] || { title: '', description: '' }),
        [field]: value,
      },
    }));
    setMessage('');
    setError('');
  };

  const handleUpdateSavedMeeting = async (meetingId) => {
    try {
      setMessage('');
      setError('');
      setUpdatingMeetingId(meetingId);

      const form = savedMeetingEditForms[meetingId] || {};
      const title = String(form.title || '').trim();
      const description = String(form.description || '').trim();

      if (!title) {
        throw new Error('Meeting title is required.');
      }

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('You must be logged in to edit a Type 2 meeting.');
      }

      const response = await fetch(`${API_BASE}/type2/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update Type 2 meeting.');
      }

      setSavedMeetings((current) =>
        current.map((meeting) =>
          String(meeting.id) === String(meetingId) ? data.meeting : meeting
        )
      );

      await fetchMeetingDetail(meetingId);
      setMessage('Saved Group Meeting updated successfully.');
      setError('');
    } catch (updateError) {
      console.error(updateError);
      setError(updateError.message || 'Unable to update Type 2 meeting.');
      setMessage('');
    } finally {
      setUpdatingMeetingId(null);
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    try {
      setDeletingMeetingId(meetingId);
      setMessage('');
      setError('');

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('You must be logged in to delete a Type 2 meeting.');
      }

      const response = await fetch(`${API_BASE}/type2/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete Type 2 meeting.');
      }

      setSavedMeetings((current) =>
        current.filter((meeting) => String(meeting.id) !== String(meetingId))
      );
      setSavedMeetingDetails((current) => {
        const copy = { ...current };
        delete copy[meetingId];
        return copy;
      });

      if (expandedMeetingId === meetingId) {
        setExpandedMeetingId(null);
      }

      if (editingSavedMeetingId === meetingId) {
        setEditingSavedMeetingId(null);
      }

      setMessage('Group meeting deleted successfully.');
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError.message || 'Unable to delete Type 2 meeting.');
    } finally {
      setDeletingMeetingId(null);
    }
  };

  const handleSavedMeetingInviteeInputChange = (meetingId, value) => {
    setSavedMeetingInviteeInputs((current) => ({
      ...current,
      [meetingId]: value,
    }));
  };

  const handleSavedMeetingSlotInputChange = (meetingId, field, value) => {
    setSavedMeetingSlotInputs((current) => ({
      ...current,
      [meetingId]: {
        ...(current[meetingId] || { start: '', end: '' }),
        [field]: value,
      },
    }));
  };

  const handleAddInviteeToSavedMeeting = async (meetingId) => {
    try {
      const email = String(savedMeetingInviteeInputs[meetingId] || '').trim().toLowerCase();

      if (!email) {
        setError('Please type an email before adding.');
        return;
      }

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('You must be logged in to edit invitees.');
      }

      const response = await fetch(`${API_BASE}/type2/meetings/${meetingId}/invitees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add invitee.');
      }

      setSavedMeetingInviteeInputs((current) => ({
        ...current,
        [meetingId]: '',
      }));

      await fetchMeetingDetail(meetingId);
      setMessage('Invitee added successfully.');
      setError('');
    } catch (addError) {
      console.error(addError);
      setError(addError.message || 'Unable to add invitee.');
      setMessage('');
    }
  };

  const handleRemoveInviteeFromSavedMeeting = async (meetingId, userId) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('You must be logged in to remove invitees.');
      }

      const response = await fetch(
        `${API_BASE}/type2/meetings/${meetingId}/invitees/${userId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove invitee.');
      }

      await fetchMeetingDetail(meetingId);
      setMessage('Invitee removed successfully.');
      setError('');
    } catch (removeError) {
      console.error(removeError);
      setError(removeError.message || 'Unable to remove invitee.');
      setMessage('');
    }
  };

  const handleAddSlotToSavedMeeting = async (meetingId) => {
    try {
      const start = savedMeetingSlotInputs[meetingId]?.start || '';
      const end = savedMeetingSlotInputs[meetingId]?.end || '';

      if (!start || !end) {
        setError('Please fill in both start and end time before adding a slot.');
        return;
      }

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('You must be logged in to add slots.');
      }

      const response = await fetch(`${API_BASE}/type2/meetings/${meetingId}/slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add candidate slot.');
      }

      setSavedMeetingSlotInputs((current) => ({
        ...current,
        [meetingId]: { start: '', end: '' },
      }));

      await fetchMeetingDetail(meetingId);
      setMessage('Candidate slot added successfully.');
      setError('');
    } catch (addError) {
      console.error(addError);
      setError(addError.message || 'Unable to add candidate slot.');
      setMessage('');
    }
  };

  const handleRemoveSlotFromSavedMeeting = async (meetingId, slotId) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('You must be logged in to remove slots.');
      }

      const response = await fetch(
        `${API_BASE}/type2/meetings/${meetingId}/slots/${slotId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove candidate slot.');
      }

      await fetchMeetingDetail(meetingId);
      setMessage('Candidate slot removed successfully.');
      setError('');
    } catch (removeError) {
      console.error(removeError);
      setError(removeError.message || 'Unable to remove candidate slot.');
      setMessage('');
    }
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
          <h1>Create Group Meeting</h1>
          <p className="booking-subtitle">
            Build one whole group meeting with several candidate time slots, then save it so invited users can see it on their vote page.
          </p>
        </header>

        {message && <p className="notice success">{message}</p>}
        {error && <p className="notice error">{error}</p>}

        <section className="booking-layout">
          <section className="card booking-form">
            <h2>Current Group Meeting Draft</h2>

            <label>
              Meeting Title
              <input
                type="text"
                name="title"
                value={type2Draft.title}
                onChange={handleDraftChange}
                placeholder="Enter group meeting title"
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={type2Draft.description}
                onChange={handleDraftChange}
                placeholder="Optional short description"
              />
            </label>

            <label>
              Invited Users
              <textarea
                name="invitees"
                value={type2Draft.invitees}
                onChange={handleDraftChange}
                placeholder="Enter McGill emails separated by commas"
              />
            </label>

            <div className="invitee-preview-box">
              <p className="summary-title">Invited Users Preview</p>
              {inviteeList.length === 0 ? (
                <p>No invited users added yet.</p>
              ) : (
                <ul className="invitee-list">
                  {[...inviteeList].sort((a, b) => a.localeCompare(b)).map((email) => (
                    <li key={email}>{email}</li>
                  ))}
                </ul>
              )}
            </div>

            <h3>Candidate Time Slots</h3>

            <div className="summary-list">
              {sortedCandidateSlots.map((slot, index) => {
                const isSelected = slot.id === selectedCandidateId;

                return (
                  <div
                    key={slot.id}
                    className={`summary-item ${isSelected ? 'selected-summary-item' : ''}`}
                  >
                    <div className="summary-main">
                      <p className="summary-title">Option {index + 1}</p>

                      <div className="same-line-row">
                        <label>
                          Start Date & Time
                          <input
                            type="datetime-local"
                            value={slot.start}
                            onChange={(event) =>
                              handleCandidateSlotChange(slot.id, 'start', event.target.value)
                            }
                          />
                        </label>

                        <label>
                          End Date & Time
                          <input
                            type="datetime-local"
                            value={slot.end}
                            onChange={(event) =>
                              handleCandidateSlotChange(slot.id, 'end', event.target.value)
                            }
                          />
                        </label>
                      </div>

                      <div className="inline-actions">
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => setSelectedCandidateId(slot.id)}
                        >
                          Select
                        </button>

                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => handleRemoveCandidateSlot(slot.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="inline-actions">
              <button
                type="button"
                className="button secondary"
                onClick={handleAddCandidateSlot}
              >
                Add Another Time Slot
              </button>

              <button
                type="button"
                onClick={handleSaveGroupMeeting}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Group Meeting'}
              </button>
            </div>
          </section>

          <section className="card booking-side-panel">
            <h2>Saved Group Meetings</h2>

            {loadingSavedMeetings ? (
              <p>Loading saved meetings...</p>
            ) : savedMeetings.length === 0 ? (
              <p>No saved Type 2 group meetings yet.</p>
            ) : (
              <div className="summary-list summary-list-scroll">
                {savedMeetings.map((meeting) => {
                  const isExpanded = String(expandedMeetingId) === String(meeting.id);
                  const detail = savedMeetingDetails[meeting.id];
                  const isEditing = String(editingSavedMeetingId) === String(meeting.id);
                  const editForm = savedMeetingEditForms[meeting.id] || {
                    title: meeting.title || '',
                    description: meeting.description || '',
                  };

                  return (
                    <div
                      key={meeting.id}
                      className={`saved-meeting-card ${isExpanded ? 'selected-summary-item' : ''}`}
                    >
                      <div className="saved-meeting-header">
                        <div className="saved-meeting-header-main">
                          <p className="summary-title">{meeting.title}</p>
                          <p>{meeting.description || 'No description.'}</p>
                          <p>Status: {meeting.status}</p>
                        </div>

                        <div className="inline-actions saved-meeting-actions">
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => handleEditSavedMeeting(meeting.id)}
                          >
                            {isEditing ? 'Close Edit' : 'Edit'}
                          </button>

                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => handleDeleteMeeting(meeting.id)}
                            disabled={deletingMeetingId === meeting.id}
                          >
                            {deletingMeetingId === meeting.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>

                      {isExpanded && detail && (
                        <div className="saved-meeting-expanded">
                          {isEditing && (
                            <div className="saved-invitees-box collapsible-section">
                              <p className="summary-title">Edit Meeting Info</p>

                              <label>
                                Title
                                <input
                                  type="text"
                                  value={editForm.title}
                                  onChange={(event) =>
                                    handleSavedMeetingEditFieldChange(
                                      meeting.id,
                                      'title',
                                      event.target.value
                                    )
                                  }
                                />
                              </label>

                              <label style={{ marginTop: '10px' }}>
                                Description
                                <textarea
                                  value={editForm.description}
                                  onChange={(event) =>
                                    handleSavedMeetingEditFieldChange(
                                      meeting.id,
                                      'description',
                                      event.target.value
                                    )
                                  }
                                />
                              </label>

                              <div className="inline-actions" style={{ marginTop: '10px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSavedMeeting(meeting.id)}
                                  disabled={updatingMeetingId === meeting.id}
                                >
                                  {updatingMeetingId === meeting.id ? 'Saving...' : 'Save Meeting Info'}
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="saved-invitees-box collapsible-section">
                            <p className="summary-title">Invited Users</p>

                            {!detail.invitees?.length ? (
                              <p>No invitees found.</p>
                            ) : (
                              <ul className="invitee-list">
                                {detail.invitees.map((invitee) => (
                                  <li key={invitee.id} className="invitee-row">
                                    <span>
                                      {invitee.name} ({invitee.email})
                                    </span>
                                    <button
                                      type="button"
                                      className="button secondary"
                                      onClick={() =>
                                        handleRemoveInviteeFromSavedMeeting(meeting.id, invitee.id)
                                      }
                                    >
                                      Remove
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}

                            <div className="invitee-input-row" style={{ marginTop: '10px' }}>
                              <input
                                type="email"
                                placeholder="Add invitee email"
                                value={savedMeetingInviteeInputs[meeting.id] || ''}
                                onChange={(event) =>
                                  handleSavedMeetingInviteeInputChange(meeting.id, event.target.value)
                                }
                              />
                              <button
                                type="button"
                                onClick={() => handleAddInviteeToSavedMeeting(meeting.id)}
                              >
                                Add Invitee
                              </button>
                            </div>
                          </div>

                          <div className="saved-invitees-box collapsible-section">
                            <p className="summary-title">Candidate Slots</p>

                            {!detail.slots?.length ? (
                              <p>No candidate slots found.</p>
                            ) : (
                              <div className="summary-list">
                                {detail.slots.map((slot) => (
                                  <div key={slot.id} className="summary-item">
                                    <div className="summary-main">
                                      <p>Start: {formatReadableDateTime(slot.start)}</p>
                                      <p>End: {formatReadableDateTime(slot.end)}</p>
                                    </div>

                                    <button
                                      type="button"
                                      className="button secondary"
                                      onClick={() =>
                                        handleRemoveSlotFromSavedMeeting(meeting.id, slot.id)
                                      }
                                    >
                                      Remove Slot
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="same-line-row" style={{ marginTop: '10px' }}>
                              <label>
                                Start
                                <input
                                  type="datetime-local"
                                  value={savedMeetingSlotInputs[meeting.id]?.start || ''}
                                  onChange={(event) =>
                                    handleSavedMeetingSlotInputChange(
                                      meeting.id,
                                      'start',
                                      event.target.value
                                    )
                                  }
                                />
                              </label>

                              <label>
                                End
                                <input
                                  type="datetime-local"
                                  value={savedMeetingSlotInputs[meeting.id]?.end || ''}
                                  onChange={(event) =>
                                    handleSavedMeetingSlotInputChange(
                                      meeting.id,
                                      'end',
                                      event.target.value
                                    )
                                  }
                                />
                              </label>

                              <div className="inline-actions">
                                <button
                                  type="button"
                                  onClick={() => handleAddSlotToSavedMeeting(meeting.id)}
                                >
                                  Add Slot
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
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
            <h2>Calendar Preview</h2>
            <p>
              Click one candidate slot row first, then select a time range on the calendar to fill it.
            </p>
          </div>

          <CalendarGrid
            mode="type2-create"
            events={calendarEvents}
            onSelectSlot={handleCalendarSelect}
            onSelectEvent={handleCalendarEventClick}
          />
        </section>
      </main>
    </>
  );
}

export default Type2CreateGroupMeetingPage;