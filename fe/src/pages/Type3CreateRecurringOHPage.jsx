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

function addDays(dateInput, days) {
  const next = new Date(dateInput);
  next.setDate(next.getDate() + days);
  return next;
}

function Type3CreateRecurringOHPage({
  onBack,
  onLogout,
  user,
  type3Draft,
  setType3Draft,
}) {
  const defaultEditor = {
    start: '',
    end: '',
    capacity: 1,
  };

  const [selectedSavedSlotId, setSelectedSavedSlotId] = useState(null);
  const [slotEditor, setSlotEditor] = useState(defaultEditor);
  const [ownerSlots, setOwnerSlots] = useState([]);
  const [loadingOwnerSlots, setLoadingOwnerSlots] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isEditorComplete = useMemo(() => {
    if (!slotEditor.start || !slotEditor.end) return false;

    const start = new Date(slotEditor.start);
    const end = new Date(slotEditor.end);
    const capacity = Number(slotEditor.capacity);

    return (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end > start &&
      capacity >= 1
    );
  }, [slotEditor]);

  const fetchOwnerSlots = async () => {
    try {
      setLoadingOwnerSlots(true);

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setOwnerSlots([]);
        return;
      }

      const response = await fetch(`${API_BASE}/type3/owner/slots`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load Type 3 owner slots.');
      }

      setOwnerSlots(data.slots || []);
      setError('');
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || 'Unable to load Type 3 owner slots.');
      setOwnerSlots([]);
    } finally {
      setLoadingOwnerSlots(false);
    }
  };

  useEffect(() => {
    void fetchOwnerSlots();
  }, [user]);

  const sortedSavedSlots = useMemo(() => {
    return [...ownerSlots].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [ownerSlots]);

  const savedEvents = useMemo(() => {
    return ownerSlots.map((slot) => ({
      id: String(slot.id),
      title: `${slot.title} (${slot.bookedCount || 0}/${slot.capacity || 1})`,
      start: slot.start,
      end: slot.end,
      extendedProps: {
        baseSlotId: slot.id,
        capacity: slot.capacity,
        bookedCount: slot.bookedCount || 0,
        isSavedRecurringSlot: true,
      },
    }));
  }, [ownerSlots]);

  const unsavedPreviewEvents = useMemo(() => {
    if (!isEditorComplete) return [];

    const safeWeeks = Math.max(1, Number(type3Draft.weeks) || 1);
    const allPreviewEvents = [];

    const start = new Date(slotEditor.start);
    const end = new Date(slotEditor.end);
    const capacity = Number(slotEditor.capacity) || 1;
    const title = type3Draft.title?.trim() || 'Office Hour';

    for (let weekIndex = 0; weekIndex < safeWeeks; weekIndex += 1) {
      const repeatedStart = addDays(start, weekIndex * 7);
      const repeatedEnd = addDays(end, weekIndex * 7);

      allPreviewEvents.push({
        id: `preview-${weekIndex + 1}`,
        title: `${title} (0/${capacity})`,
        start: repeatedStart,
        end: repeatedEnd,
        extendedProps: {
          weekIndex: weekIndex + 1,
          capacity,
          bookedCount: 0,
          isUnsavedPreview: true,
        },
      });
    }

    return allPreviewEvents;
  }, [slotEditor, type3Draft, isEditorComplete]);

  const calendarEvents = useMemo(() => {
    return [...savedEvents, ...unsavedPreviewEvents];
  }, [savedEvents, unsavedPreviewEvents]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setType3Draft((current) => ({
      ...current,
      [name]: value,
    }));
    setMessage('');
    setError('');
  };

  const resetEditor = () => {
    setSelectedSavedSlotId(null);
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
    const capacity = Number(slotEditor.capacity);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'Please enter valid date/time values.';
    }

    if (end <= start) {
      return 'End time must be after start time.';
    }

    if (!capacity || capacity < 1) {
      return 'Capacity must be at least 1.';
    }

    return '';
  };

  const handleCalendarSelect = ({ start, end }) => {
    setSlotEditor((current) => ({
      ...current,
      start: toDateTimeLocalValue(start),
      end: toDateTimeLocalValue(end),
    }));
    setSelectedSavedSlotId(null);
    setMessage('');
    setError('');
  };

  const handleCalendarEventClick = (calendarEvent) => {
    if (calendarEvent.extendedProps?.isUnsavedPreview) {
      return;
    }

    const matchedSavedSlot = ownerSlots.find(
      (slot) => String(slot.id) === String(calendarEvent.id)
    );

    if (!matchedSavedSlot) return;

    setSelectedSavedSlotId(matchedSavedSlot.id);
    setSlotEditor({
      start: toDateTimeLocalValue(matchedSavedSlot.start),
      end: toDateTimeLocalValue(matchedSavedSlot.end),
      capacity: matchedSavedSlot.capacity ?? 1,
    });
    setMessage('');
    setError('');
  };

  const handleSaveRecurringOfficeHours = async () => {
    setMessage('');
    setError('');

    const validationMessage = validateEditor();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setError('You must be logged in to save Type 3 slots.');
      return;
    }

    if (selectedSavedSlotId) {
      setError('Editing existing Type 3 slots is not wired yet. Please create a new series for now.');
      return;
    }

    const capacity = Number(slotEditor.capacity);
    const weeks = Math.max(1, Number(type3Draft.weeks) || 1);
    const title = type3Draft.title?.trim() || 'Office Hour';
    const notes = type3Draft.description || '';

    try {
      setSaving(true);

      const baseStart = new Date(slotEditor.start);
      const baseEnd = new Date(slotEditor.end);

      for (let weekIndex = 0; weekIndex < weeks; weekIndex += 1) {
        const repeatedStart = addDays(baseStart, weekIndex * 7);
        const repeatedEnd = addDays(baseEnd, weekIndex * 7);

        const response = await fetch(`${API_BASE}/type3/slots`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            start: repeatedStart.toISOString(),
            end: repeatedEnd.toISOString(),
            location: '',
            notes,
            capacity,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || `Failed to create Type 3 slot for week ${weekIndex + 1}.`);
        }
      }

      await fetchOwnerSlots();
      setMessage(`Saved ${weeks} Type 3 office-hour session(s) to the database.`);
      resetEditor();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message || 'Unable to save recurring office-hour slots.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      setMessage('');
      setError('');
      setDeletingSlotId(slotId);

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('You must be logged in to delete Type 3 slots.');
      }

      const response = await fetch(`${API_BASE}/type3/slots/${slotId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete Type 3 slot.');
      }

      setOwnerSlots((current) =>
        current.filter((slot) => String(slot.id) !== String(slotId))
      );

      if (String(selectedSavedSlotId) === String(slotId)) {
        resetEditor();
      }

      setMessage('Type 3 slot deleted successfully.');
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError.message || 'Unable to delete Type 3 slot.');
    } finally {
      setDeletingSlotId(null);
    }
  };

  const handleStartNewSelection = () => {
    resetEditor();
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
          <h1>Create Recurring Office Hours</h1>
          <p className="booking-subtitle">
            Create a weekly recurring Type 3 office-hour series. Each weekly occurrence
            is saved to the backend and only your own created sessions are shown here.
          </p>
        </header>

        {message && <p className="notice success">{message}</p>}
        {error && <p className="notice error">{error}</p>}

        <section className="booking-layout">
          <section className="card booking-form">
            <h2>Recurring Office Hours Settings</h2>

            <label>
              Title
              <input
                type="text"
                name="title"
                value={type3Draft.title}
                onChange={handleFormChange}
                placeholder="Enter office hours title"
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={type3Draft.description}
                onChange={handleFormChange}
                placeholder="Optional short description"
              />
            </label>

            <div className="same-line-row type3-four-column-row">
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
                Repeat Weekly For
                <input
                  type="number"
                  name="weeks"
                  min="1"
                  value={type3Draft.weeks}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Capacity
                <input
                  type="number"
                  name="capacity"
                  min="1"
                  value={slotEditor.capacity}
                  onChange={handleEditorChange}
                />
              </label>
            </div>

            <p className="helper-text">
              Unsaved preview sessions are shown on the calendar immediately. Clicking
              save creates each weekly occurrence in the backend database.
            </p>

            <div className="inline-actions">
              <button
                type="button"
                className="button secondary"
                onClick={handleStartNewSelection}
                disabled={saving}
              >
                New Selection
              </button>

              <button
                type="button"
                onClick={handleSaveRecurringOfficeHours}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Recurring Office Hours'}
              </button>
            </div>
          </section>

          <section className="card booking-side-panel">
            <h2>My Saved Type 3 Sessions</h2>

            {loadingOwnerSlots ? (
              <p>Loading your Type 3 sessions...</p>
            ) : sortedSavedSlots.length === 0 ? (
              <p>No Type 3 sessions saved yet.</p>
            ) : (
              <div className="summary-list summary-list-scroll">
                {sortedSavedSlots.map((slot) => {
                  const isSelected = String(slot.id) === String(selectedSavedSlotId);

                  return (
                    <div
                      key={slot.id}
                      className={`summary-item ${isSelected ? 'selected-summary-item' : ''}`}
                    >
                      <div
                        className="summary-main"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedSavedSlotId(slot.id);
                          setSlotEditor({
                            start: toDateTimeLocalValue(slot.start),
                            end: toDateTimeLocalValue(slot.end),
                            capacity: slot.capacity ?? 1,
                          });
                          setMessage('');
                          setError('');
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            setSelectedSavedSlotId(slot.id);
                            setSlotEditor({
                              start: toDateTimeLocalValue(slot.start),
                              end: toDateTimeLocalValue(slot.end),
                              capacity: slot.capacity ?? 1,
                            });
                            setMessage('');
                            setError('');
                          }
                        }}
                      >
                        <p className="summary-title">{slot.title || 'Office Hour'}</p>
                        <p>Start: {formatReadableDateTime(slot.start)}</p>
                        <p>End: {formatReadableDateTime(slot.end)}</p>
                        <p>Reserved: {slot.bookedCount || 0} / {slot.capacity || 1}</p>
                      </div>

                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={deletingSlotId === slot.id}
                      >
                        {deletingSlotId === slot.id ? 'Deleting...' : 'Delete'}
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
              Existing sessions loaded from the backend and your unsaved recurring preview
              are shown together here.
            </p>
          </div>

          <CalendarGrid
            mode="type3-create"
            events={calendarEvents}
            onSelectSlot={handleCalendarSelect}
            onSelectEvent={handleCalendarEventClick}
          />
        </section>
      </main>
    </>
  );
}

export default Type3CreateRecurringOHPage;