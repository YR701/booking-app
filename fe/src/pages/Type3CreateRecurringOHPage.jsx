/* Author: Hanjing Zheng */

import { useMemo, useState } from 'react';
import './BookingPages.css';
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

function generateWeeklyRepeatedEvents(baseSlots, weeks, title) {
  const safeWeeks = Math.max(1, Number(weeks) || 1);
  const displayTitle = title?.trim() || 'Office Hour';
  const allEvents = [];

  baseSlots.forEach((slot) => {
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
          baseSlotId: slot.id,
          weekIndex: weekIndex + 1,
          isSavedRecurringSlot: true,
        },
      });
    }
  });

  return allEvents;
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
  };

  const [selectedSavedSlotId, setSelectedSavedSlotId] = useState(null);
  const [slotEditor, setSlotEditor] = useState(defaultEditor);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isEditorComplete = useMemo(() => {
    if (!slotEditor.start || !slotEditor.end) return false;

    const start = new Date(slotEditor.start);
    const end = new Date(slotEditor.end);

    return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
  }, [slotEditor]);

  const savedEvents = useMemo(() => {
    return generateWeeklyRepeatedEvents(
      type3Draft.savedBaseSlots,
      type3Draft.weeks,
      type3Draft.title
    );
  }, [type3Draft]);

  const unsavedPreviewEvents = useMemo(() => {
    if (!isEditorComplete) return [];

    const tempSlot = {
      id: 'unsaved-preview-slot',
      title: type3Draft.title?.trim() || 'Office Hour',
      start: new Date(slotEditor.start),
      end: new Date(slotEditor.end),
    };

    return generateWeeklyRepeatedEvents(
      [tempSlot],
      type3Draft.weeks,
      type3Draft.title
    ).map((eventItem) => ({
      ...eventItem,
      id: `preview-${eventItem.id}`,
      extendedProps: {
        ...eventItem.extendedProps,
        isUnsavedPreview: true,
      },
    }));
  }, [slotEditor, type3Draft, isEditorComplete]);

  const calendarEvents = useMemo(() => {
    return [...savedEvents, ...unsavedPreviewEvents];
  }, [savedEvents, unsavedPreviewEvents]);

  const sortedSavedSlots = useMemo(() => {
    return [...type3Draft.savedBaseSlots].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [type3Draft.savedBaseSlots]);

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

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'Please enter valid date/time values.';
    }

    if (end <= start) {
      return 'End time must be after start time.';
    }

    return '';
  };

  const handleCalendarSelect = ({ start, end }) => {
    setSlotEditor({
      start: toDateTimeLocalValue(start),
      end: toDateTimeLocalValue(end),
    });
    setSelectedSavedSlotId(null);
    setMessage('');
    setError('');
  };

  const handleCalendarEventClick = (calendarEvent) => {
    if (calendarEvent.extendedProps?.isUnsavedPreview) {
      return;
    }

    const baseSlotId = calendarEvent.extendedProps?.baseSlotId;
    if (!baseSlotId) return;

    const matchedSavedSlot = type3Draft.savedBaseSlots.find(
      (slot) => slot.id === baseSlotId
    );
    if (!matchedSavedSlot) return;

    setSelectedSavedSlotId(baseSlotId);
    setSlotEditor({
      start: toDateTimeLocalValue(matchedSavedSlot.start),
      end: toDateTimeLocalValue(matchedSavedSlot.end),
    });
    setMessage('');
    setError('');
  };

  const handleSaveRecurringOfficeHours = () => {
    setMessage('');
    setError('');

    const validationMessage = validateEditor();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const start = new Date(slotEditor.start);
    const end = new Date(slotEditor.end);

    if (selectedSavedSlotId) {
      setType3Draft((current) => ({
        ...current,
        savedBaseSlots: current.savedBaseSlots.map((slot) =>
          slot.id === selectedSavedSlotId
            ? {
                ...slot,
                title: current.title.trim() || 'Office Hour',
                start,
                end,
              }
            : slot
        ),
      }));
      setMessage('Recurring office-hour slot updated.');
    } else {
      const duplicateExists = type3Draft.savedBaseSlots.some(
        (slot) =>
          new Date(slot.start).getTime() === start.getTime() &&
          new Date(slot.end).getTime() === end.getTime()
      );

      if (duplicateExists) {
        setError('This recurring slot already exists.');
        return;
      }

      const newSlot = {
        id: `saved-slot-${Date.now()}`,
        title: type3Draft.title.trim() || 'Office Hour',
        start,
        end,
      };

      setType3Draft((current) => ({
        ...current,
        savedBaseSlots: [...current.savedBaseSlots, newSlot],
      }));
      setMessage('Recurring office-hour slot saved.');
    }

    resetEditor();
  };

  const handleRemoveSavedSlot = (slotId) => {
    setType3Draft((current) => ({
      ...current,
      savedBaseSlots: current.savedBaseSlots.filter((slot) => slot.id !== slotId),
    }));

    if (selectedSavedSlotId === slotId) {
      resetEditor();
    }

    setMessage('Recurring office-hour slot removed.');
    setError('');
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
            Choose an exact first start and end time, preview it immediately on the
            calendar, and save it as a weekly recurring office-hour slot when ready.
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
                Repeat Weekly For
                <input
                  type="number"
                  name="weeks"
                  min="1"
                  value={type3Draft.weeks}
                  onChange={handleFormChange}
                />
              </label>
            </div>

            <p className="helper-text">
              When the start time, end time, and repeat weeks are filled correctly,
              an unsaved preview appears on the calendar. Click <strong>Save Recurring Office Hours</strong>
              to save that recurring slot. After saving, the editor resets for a new selection.
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
                onClick={handleSaveRecurringOfficeHours}
              >
                Save Recurring Office Hours
              </button>
            </div>
          </section>

          <section className="card booking-side-panel">
            <h2>Saved Recurring Slots</h2>

            {sortedSavedSlots.length === 0 ? (
              <p>No recurring slots saved yet.</p>
            ) : (
              <div className="summary-list">
                {sortedSavedSlots.map((slot) => {
                  const isSelected = slot.id === selectedSavedSlotId;

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
                            });
                            setMessage('');
                            setError('');
                          }
                        }}
                      >
                        <p className="summary-title">{slot.title || 'Office Hour'}</p>
                        <p>Start: {formatReadableDateTime(slot.start)}</p>
                        <p>End: {formatReadableDateTime(slot.end)}</p>
                        <p>Repeated weekly for {Math.max(1, Number(type3Draft.weeks) || 1)} week(s)</p>
                      </div>

                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => handleRemoveSavedSlot(slot.id)}
                      >
                        Remove
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
              Select a time range on the calendar to fill the editor above. That creates
              only a temporary preview until you click <strong>Save Recurring Office Hours</strong>.
              Click a saved calendar event to load it back into the editor for editing.
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