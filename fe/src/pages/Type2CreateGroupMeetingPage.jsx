/* Author: Hanjing Zheng */

import { useMemo, useState } from 'react';
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

function addDays(dateInput, days) {
  const next = new Date(dateInput);
  next.setDate(next.getDate() + days);
  return next;
}

function generateCandidatePreviewEvents(candidateSlots, previewWeeks, title) {
  const safeWeeks = Math.max(1, Number(previewWeeks) || 1);
  const displayTitle = title?.trim() || 'Group Meeting';
  const allEvents = [];

  candidateSlots.forEach((slot) => {
    const baseStart = new Date(slot.start);
    const baseEnd = new Date(slot.end);

    for (let weekIndex = 0; weekIndex < safeWeeks; weekIndex += 1) {
      const repeatedStart = addDays(baseStart, weekIndex * 7);
      const repeatedEnd = addDays(baseEnd, weekIndex * 7);

      allEvents.push({
        id: `${slot.id}-week-${weekIndex + 1}`,
        title: slot.title || displayTitle,
        start: repeatedStart,
        end: repeatedEnd,
        extendedProps: {
          candidateSlotId: slot.id,
          weekIndex: weekIndex + 1,
          isSavedCandidateSlot: true,
        },
      });
    }
  });

  return allEvents;
}

function parseInvitees(inviteesText) {
  return inviteesText
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

function isValidMcGillEmail(email) {
  return email.endsWith('@mail.mcgill.ca') || email.endsWith('@mcgill.ca');
}

function Type2CreateGroupMeetingPage({
  onBack,
  onLogout,
  user,
  type2Draft,
  setType2Draft,
}) {
  const defaultEditor = {
    start: '',
    end: '',
  };

  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [slotEditor, setSlotEditor] = useState(defaultEditor);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [expandedInviteeSlotId, setExpandedInviteeSlotId] = useState(null);
  const [inviteeSearchTerms, setInviteeSearchTerms] = useState({});
  const [inviteeAddInputs, setInviteeAddInputs] = useState({});

  const isEditorComplete = useMemo(() => {
    if (!slotEditor.start || !slotEditor.end) return false;

    const start = new Date(slotEditor.start);
    const end = new Date(slotEditor.end);

    return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
  }, [slotEditor]);

  const inviteeList = useMemo(() => {
    return parseInvitees(type2Draft.invitees);
  }, [type2Draft.invitees]);

  const savedEvents = useMemo(() => {
    return generateCandidatePreviewEvents(
      type2Draft.candidateSlots,
      type2Draft.previewWeeks,
      type2Draft.title
    );
  }, [type2Draft]);

  const unsavedPreviewEvents = useMemo(() => {
    if (!isEditorComplete) return [];

    const tempSlot = {
      id: 'unsaved-candidate-preview',
      title: type2Draft.title?.trim() || 'Group Meeting',
      start: new Date(slotEditor.start),
      end: new Date(slotEditor.end),
    };

    return generateCandidatePreviewEvents(
      [tempSlot],
      type2Draft.previewWeeks,
      type2Draft.title
    ).map((eventItem) => ({
      ...eventItem,
      id: `preview-${eventItem.id}`,
      extendedProps: {
        ...eventItem.extendedProps,
        isUnsavedPreview: true,
      },
    }));
  }, [slotEditor, type2Draft, isEditorComplete]);

  const calendarEvents = useMemo(() => {
    return [...savedEvents, ...unsavedPreviewEvents];
  }, [savedEvents, unsavedPreviewEvents]);

  const sortedCandidateSlots = useMemo(() => {
    return [...type2Draft.candidateSlots].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [type2Draft.candidateSlots]);

  const handleDraftChange = (event) => {
    const { name, value } = event.target;
    setType2Draft((current) => ({
      ...current,
      [name]: value,
    }));
    setMessage('');
    setError('');
  };

  const resetEditor = () => {
    setSelectedCandidateId(null);
    setSlotEditor(defaultEditor);
  };

  const handleEditorChange = (event) => {
    const { name, value } = event.target;

    setSlotEditor((current) => ({
      ...current,
      [name]: value,
    }));
    setMessage('');
    setError('');
  };

  const validateEditor = () => {
    if (!slotEditor.start || !slotEditor.end) {
      return 'Please choose both start and end date/time.';
    }

    const start = new Date(slotEditor.start);
    const end = new Date(slotEditor.end);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'Please enter valid date/time values.';
    }

    if (end <= start) {
      return 'End time must be after start time.';
    }

    return '';
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

  const handleCalendarSelect = ({ start, end }) => {
    setSlotEditor({
      start: toDateTimeLocalValue(start),
      end: toDateTimeLocalValue(end),
    });
    setSelectedCandidateId(null);
    setMessage('');
    setError('');
  };

  const handleCalendarEventClick = (calendarEvent) => {
    if (calendarEvent.extendedProps?.isUnsavedPreview) {
      return;
    }

    const candidateSlotId = calendarEvent.extendedProps?.candidateSlotId;
    if (!candidateSlotId) return;

    const matchedCandidate = type2Draft.candidateSlots.find(
      (slot) => slot.id === candidateSlotId
    );
    if (!matchedCandidate) return;

    setSelectedCandidateId(candidateSlotId);
    setSlotEditor({
      start: toDateTimeLocalValue(matchedCandidate.start),
      end: toDateTimeLocalValue(matchedCandidate.end),
    });
    setMessage('');
    setError('');
  };

  const handleSaveCandidateSlot = () => {
    setMessage('');
    setError('');

    const editorValidationMessage = validateEditor();
    if (editorValidationMessage) {
      setError(editorValidationMessage);
      return;
    }

    const defaultInvitees = parseInvitees(type2Draft.invitees);
    const inviteesValidationMessage = validateInvitees(defaultInvitees);
    if (inviteesValidationMessage) {
      setError(inviteesValidationMessage);
      return;
    }

    const start = new Date(slotEditor.start);
    const end = new Date(slotEditor.end);

    if (selectedCandidateId) {
      setType2Draft((current) => ({
        ...current,
        candidateSlots: current.candidateSlots.map((slot) =>
          slot.id === selectedCandidateId
            ? {
                ...slot,
                title: current.title.trim() || 'Group Meeting',
                start,
                end,
              }
            : slot
        ),
      }));
      setMessage('Candidate meeting slot updated.');
    } else {
      const duplicateExists = type2Draft.candidateSlots.some(
        (slot) =>
          new Date(slot.start).getTime() === start.getTime() &&
          new Date(slot.end).getTime() === end.getTime()
      );

      if (duplicateExists) {
        setError('This candidate meeting slot already exists.');
        return;
      }

      const newSlot = {
        id: `candidate-slot-${Date.now()}`,
        title: type2Draft.title.trim() || 'Group Meeting',
        start,
        end,
        invitedUsers: defaultInvitees,
      };

      setType2Draft((current) => ({
        ...current,
        candidateSlots: [...current.candidateSlots, newSlot],
      }));
      setMessage('Candidate meeting slot saved.');
    }

    resetEditor();
  };

  const handleRemoveCandidateSlot = (slotId) => {
    setType2Draft((current) => ({
      ...current,
      candidateSlots: current.candidateSlots.filter((slot) => slot.id !== slotId),
    }));

    if (selectedCandidateId === slotId) {
      resetEditor();
    }

    if (expandedInviteeSlotId === slotId) {
      setExpandedInviteeSlotId(null);
    }

    setMessage('Candidate meeting slot removed.');
    setError('');
  };

  const handleStartNewSelection = () => {
    resetEditor();
    setMessage('');
    setError('');
  };

  const handleToggleInviteeSection = (slotId) => {
    setExpandedInviteeSlotId((current) => (current === slotId ? null : slotId));
  };

  const handleInviteeSearchChange = (slotId, value) => {
    setInviteeSearchTerms((current) => ({
      ...current,
      [slotId]: value,
    }));
  };

  const handleInviteeAddInputChange = (slotId, value) => {
    setInviteeAddInputs((current) => ({
      ...current,
      [slotId]: value,
    }));
  };

  const handleAddInviteeToSavedSlot = (slotId) => {
    const email = (inviteeAddInputs[slotId] || '').trim();

    if (!email) {
      setError('Please type an email before adding.');
      return;
    }

    if (!isValidMcGillEmail(email)) {
      setError(`Invalid McGill email: ${email}`);
      return;
    }

    setType2Draft((current) => ({
      ...current,
      candidateSlots: current.candidateSlots.map((slot) => {
        if (slot.id !== slotId) return slot;

        const existing = slot.invitedUsers || [];
        if (existing.includes(email)) return slot;

        return {
          ...slot,
          invitedUsers: [...existing, email],
        };
      }),
    }));

    setInviteeAddInputs((current) => ({
      ...current,
      [slotId]: '',
    }));

    setMessage('Invited user added to saved candidate slot.');
    setError('');
  };

  const handleRemoveInviteeFromSavedSlot = (slotId, emailToRemove) => {
    setType2Draft((current) => ({
      ...current,
      candidateSlots: current.candidateSlots.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              invitedUsers: (slot.invitedUsers || []).filter(
                (email) => email !== emailToRemove
              ),
            }
          : slot
      ),
    }));

    setMessage('Invited user removed from saved candidate slot.');
    setError('');
  };

  const handlePrepareDraft = (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (type2Draft.candidateSlots.length === 0) {
      setError('Please save at least one candidate meeting slot first.');
      return;
    }

    const slotWithoutInvitees = type2Draft.candidateSlots.find(
      (slot) => !slot.invitedUsers || slot.invitedUsers.length === 0
    );

    if (slotWithoutInvitees) {
      setError('Each saved candidate slot must have at least one invited user.');
      return;
    }

    const payload = {
      title: type2Draft.title,
      description: type2Draft.description,
      previewWeeks: Number(type2Draft.previewWeeks),
      candidateSlots: type2Draft.candidateSlots.map((slot) => ({
        title: slot.title,
        start: new Date(slot.start).toISOString(),
        end: new Date(slot.end).toISOString(),
        invitedUsers: [...(slot.invitedUsers || [])].sort((a, b) =>
          a.localeCompare(b)
        ),
      })),
      previewOccurrences: savedEvents.map((eventItem) => ({
        title: eventItem.title,
        start: new Date(eventItem.start).toISOString(),
        end: new Date(eventItem.end).toISOString(),
        weekIndex: eventItem.extendedProps.weekIndex,
        candidateSlotId: eventItem.extendedProps.candidateSlotId,
      })),
    };

    console.log('Final Type 2 create payload:', payload);
    setMessage('Group meeting draft prepared. Check console output.');
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
            Create candidate meeting times, add invited users, and preview the
            options on the calendar before users vote on them.
          </p>
        </header>

        {message && <p className="notice success">{message}</p>}
        {error && <p className="notice error">{error}</p>}

        <section className="booking-layout">
          <section className="card booking-form">
            <h2>Group Meeting Settings</h2>

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
              Default Invited Users
              <textarea
                name="invitees"
                value={type2Draft.invitees}
                onChange={handleDraftChange}
                placeholder="Enter McGill emails separated by commas"
              />
            </label>

            <div className="invitee-preview-box">
              <p className="summary-title">Default Invited Users</p>
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

            <div className="same-line-row">
              <label>
                Start Date & Time
                <input
                  type="datetime-local"
                  name="start"
                  value={slotEditor.start}
                  onChange={handleEditorChange}
                />
              </label>

              <label>
                End Date & Time
                <input
                  type="datetime-local"
                  name="end"
                  value={slotEditor.end}
                  onChange={handleEditorChange}
                />
              </label>

              <label>
                Preview Weeks
                <input
                  type="number"
                  name="previewWeeks"
                  min="1"
                  value={type2Draft.previewWeeks}
                  onChange={handleDraftChange}
                />
              </label>
            </div>

            <p className="helper-text">
              Select a time range on the calendar or type exact values above.
              Then click <strong>Save Candidate Slot</strong>. New candidate slots
              will start with the default invited users, and you can edit each slot’s
              invitee list below.
            </p>

            <div className="inline-actions">
              <button
                type="button"
                className="button secondary"
                onClick={handleStartNewSelection}
              >
                New Selection
              </button>

              <button
                type="button"
                onClick={handleSaveCandidateSlot}
              >
                Save Candidate Slot
              </button>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="button secondary"
                onClick={handlePrepareDraft}
              >
                Prepare Group Meeting Draft
              </button>
            </div>
          </section>

          <section className="card booking-side-panel">
            <h2>Saved Candidate Slots</h2>

            {sortedCandidateSlots.length === 0 ? (
              <p>No candidate meeting slots saved yet.</p>
            ) : (
              <div className="summary-list">
                {sortedCandidateSlots.map((slot) => {
                  const isSelected = slot.id === selectedCandidateId;
                  const isExpanded = expandedInviteeSlotId === slot.id;
                  const sortedInvitees = [...(slot.invitedUsers || [])].sort((a, b) =>
                    a.localeCompare(b)
                  );
                  const searchTerm = inviteeSearchTerms[slot.id] || '';
                  const filteredInvitees = sortedInvitees.filter((email) =>
                    email.toLowerCase().includes(searchTerm.toLowerCase())
                  );

                  return (
                    <div
                      key={slot.id}
                      className={`summary-item ${isSelected ? 'selected-summary-item' : ''}`}
                    >
                      <div className="summary-main">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelectedCandidateId(slot.id);
                            setSlotEditor({
                              start: toDateTimeLocalValue(slot.start),
                              end: toDateTimeLocalValue(slot.end),
                            });
                            setMessage('');
                            setError('');
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              setSelectedCandidateId(slot.id);
                              setSlotEditor({
                                start: toDateTimeLocalValue(slot.start),
                                end: toDateTimeLocalValue(slot.end),
                              });
                              setMessage('');
                              setError('');
                            }
                          }}
                        >
                          <p className="summary-title">{slot.title || 'Group Meeting'}</p>
                          <p>Start: {formatReadableDateTime(slot.start)}</p>
                          <p>End: {formatReadableDateTime(slot.end)}</p>
                          <p>
                            Preview repeated for{' '}
                            {Math.max(1, Number(type2Draft.previewWeeks) || 1)} week(s)
                          </p>
                          <p>Invited users: {sortedInvitees.length}</p>
                        </div>

                        <div className="inline-actions slot-top-actions">
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => handleToggleInviteeSection(slot.id)}
                          >
                            {isExpanded ? 'Hide Invited Users' : 'Show Invited Users'}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="saved-invitees-box collapsible-section">
                            <p className="summary-title">Invited Users For This Slot</p>

                            <input
                              type="text"
                              className="invitee-search-input"
                              placeholder="Search invited users"
                              value={searchTerm}
                              onChange={(event) =>
                                handleInviteeSearchChange(slot.id, event.target.value)
                              }
                            />

                            <div className="invitee-list-scroll">
                              {filteredInvitees.length === 0 ? (
                                <p>No matching invited users.</p>
                              ) : (
                                <ul className="invitee-list">
                                  {filteredInvitees.map((email) => (
                                    <li key={email} className="invitee-row">
                                      <span>{email}</span>
                                      <button
                                        type="button"
                                        className="button secondary small-button"
                                        onClick={() =>
                                          handleRemoveInviteeFromSavedSlot(slot.id, email)
                                        }
                                      >
                                        Remove
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            <div className="inline-actions">
                              <input
                                type="email"
                                className="invitee-inline-input"
                                placeholder="Add one email"
                                value={inviteeAddInputs[slot.id] || ''}
                                onChange={(event) =>
                                  handleInviteeAddInputChange(slot.id, event.target.value)
                                }
                              />
                              <button
                                type="button"
                                className="button secondary"
                                onClick={() => handleAddInviteeToSavedSlot(slot.id)}
                              >
                                Add Invitee
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => handleRemoveCandidateSlot(slot.id)}
                      >
                        Remove Slot
                      </button>
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
              Candidate meeting slots are shown here. Invited users will later vote
              on these saved options.
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
