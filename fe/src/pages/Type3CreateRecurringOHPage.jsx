/* Author: Hanjing Zheng */

import { API_BASE, TOKEN_KEY } from '../config';
import { useEffect, useMemo, useState } from 'react';
import './SchedulerPages.css';
import './switchButton.css';
import DashboardTopnav from '../components/DashboardTopnav';
import ConfirmDialog from '../components/ConfirmDialog';
import CalendarGrid from '../components/CalendarGrid';
import { getDateTimeLocalNow, toDateTimeLocalValue } from '../utils/dateTimeLocal';
import { formatReadableDateTime } from '../utils/formatTime';

function addDays(dateInput, days) {
  const next = new Date(dateInput);
  next.setDate(next.getDate() + days);
  return next;
}

function Type3CreateRecurringOHPage({
  onLogout,
  user,
  type3Draft,
  setType3Draft,
  onBack,
}) {
  const defaultEditor = {
    start: '',
    end: '',
    capacity: 1,
  };

  const [slotEditor, setSlotEditor] = useState(defaultEditor);
  const [ownerSlots, setOwnerSlots] = useState([]);
  const [loadingOwnerSlots, setLoadingOwnerSlots] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState(null);
  const [deleteConfirmSlotId, setDeleteConfirmSlotId] = useState(null);
  const [updatingSlotId, setUpdatingSlotId] = useState(null);
  const [expandedSlotId, setExpandedSlotId] = useState(null);
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [savedSlotEditForms, setSavedSlotEditForms] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const minDateTimeLocal = getDateTimeLocalNow();

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
      setError(fetchError.message || 'Unable to load time slots.');
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

  const totalCapacity = useMemo(() => {
  return sortedSavedSlots.reduce(
    (sum, slot) => sum + Number(slot.capacity || 0),
    0
  );
}, [sortedSavedSlots]);

const totalReserved = useMemo(() => {
  return sortedSavedSlots.reduce(
    (sum, slot) => sum + Number(slot.bookedCount || 0),
    0
  );
}, [sortedSavedSlots]);

const totalAvailableSeats = useMemo(() => {
  return Math.max(0, totalCapacity - totalReserved);
}, [totalCapacity, totalReserved]);

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

  const resetCreateEditor = () => {
    setSlotEditor(defaultEditor);
    setType3Draft((current) => ({
      ...current,
      title: 'COMP 307 Office Hours',
      description: '',
      weeks: current.weeks || 4,
    }));
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
    const now = new Date();

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'Please enter valid date/time values.';
    }

    if (end <= start) {
      return 'End time must be after start time.';
    }

    if (start < now) {
      return 'Start time cannot be in the past.';
    }

    if (!capacity || capacity < 1) {
      return 'Capacity must be at least 1.';
    }

    return '';
  };

  const validateSavedSlotForm = (form) => {
    if (!form?.title?.trim()) {
      return 'Title is required.';
    }

    if (!form?.start || !form?.end) {
      return 'Please choose both start and end date/time.';
    }

    const start = new Date(form.start);
    const end = new Date(form.end);
    const capacity = Number(form.capacity);
    const now = new Date();

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'Please enter valid date/time values.';
    }

    if (end <= start) {
      return 'End time must be after start time.';
    }

    if (start < now) {
      return 'Start time cannot be in the past.';
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

    setMessage('');
    setError('');
  };

  const handleCalendarEventClick = (calendarEvent) => {
    if (calendarEvent.extendedProps?.isUnsavedPreview) return;

    const matchedSavedSlot = ownerSlots.find(
      (slot) => String(slot.id) === String(calendarEvent.id)
    );

    if (!matchedSavedSlot) return;

    const form = {
      title: matchedSavedSlot.title || '',
      description: matchedSavedSlot.notes || '',
      start: toDateTimeLocalValue(matchedSavedSlot.start),
      end: toDateTimeLocalValue(matchedSavedSlot.end),
      capacity: matchedSavedSlot.capacity ?? 1,
    };

    setExpandedSlotId(matchedSavedSlot.id);
    setEditingSlotId(matchedSavedSlot.id);
    setSavedSlotEditForms((current) => ({
      ...current,
      [matchedSavedSlot.id]: form,
    }));
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
      setError('You must be logged in to save time slots.');
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
      setMessage(`Saved ${weeks} recurring office-hour session(s) to the database.`);
      resetCreateEditor();
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

      if (String(expandedSlotId) === String(slotId)) {
        setExpandedSlotId(null);
      }

      if (String(editingSlotId) === String(slotId)) {
        setEditingSlotId(null);
      }

      setSavedSlotEditForms((current) => {
        const copy = { ...current };
        delete copy[slotId];
        return copy;
      });

      setMessage('Time slot deleted successfully.');
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError.message || 'Unable to delete time slot.');
    } finally {
      setDeletingSlotId(null);
    }
  };

  const closeType3DeleteDialog = () => setDeleteConfirmSlotId(null);

  const confirmType3SlotDelete = () => {
    const id = deleteConfirmSlotId;
    closeType3DeleteDialog();
    if (id != null && id !== '') {
      void handleDeleteSlot(id);
    }
  };

  const handleStartNewSelection = () => {
    resetCreateEditor();
    setMessage('');
    setError('');
  };

  const handleToggleSavedSlot = (slotId) => {
    const isSame = String(expandedSlotId) === String(slotId);

    if (isSame) {
      setExpandedSlotId(null);
      setEditingSlotId(null);
      return;
    }

    setExpandedSlotId(slotId);
    setEditingSlotId(null);
  };

  const handleEditSavedSlot = (slot) => {
    const isSame = String(editingSlotId) === String(slot.id);

    if (isSame) {
      setEditingSlotId(null);
      setExpandedSlotId(null);
      return;
    }

    setExpandedSlotId(slot.id);
    setEditingSlotId(slot.id);
    setSavedSlotEditForms((current) => ({
      ...current,
      [slot.id]: {
        title: slot.title || '',
        description: slot.notes || '',
        start: toDateTimeLocalValue(slot.start),
        end: toDateTimeLocalValue(slot.end),
        capacity: slot.capacity ?? 1,
      },
    }));
    setMessage('');
    setError('');
  };

  const handleSavedSlotEditFieldChange = (slotId, field, value) => {
    setSavedSlotEditForms((current) => ({
      ...current,
      [slotId]: {
        ...(current[slotId] || {
          title: '',
          description: '',
          start: '',
          end: '',
          capacity: 1,
        }),
        [field]: value,
      },
    }));
    setMessage('');
    setError('');
  };

  const handleUpdateSavedSlot = async (slotId) => {
    try {
      setMessage('');
      setError('');
      setUpdatingSlotId(slotId);

      const form = savedSlotEditForms[slotId];
      const validationMessage = validateSavedSlotForm(form);

      if (validationMessage) {
        throw new Error(validationMessage);
      }

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('You must be logged in to edit Type 3 slots.');
      }

      const response = await fetch(`${API_BASE}/type3/slots/${slotId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          notes: form.description,
          start: new Date(form.start).toISOString(),
          end: new Date(form.end).toISOString(),
          capacity: Number(form.capacity),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update Type 3 slot.');
      }

      await fetchOwnerSlots();
      setMessage(data.message || 'Time slot updated successfully.');
      setError('');
    } catch (updateError) {
      console.error(updateError);
      setError(updateError.message || 'Unable to update time slot.');
      setMessage('');
    } finally {
      setUpdatingSlotId(null);
    }
  };

  return (
    <>
      <ConfirmDialog
        open={deleteConfirmSlotId != null}
        title="Delete this office hour slot?"
        confirmLabel="Delete"
        cancelLabel="Go back"
        onClose={closeType3DeleteDialog}
        onConfirm={confirmType3SlotDelete}
      >
        This removes the session from your schedule. Students who reserved it may be affected.
      </ConfirmDialog>

      <DashboardTopnav
        userEmail={user?.email || 'user@mail.mcgill.ca'}
        userName={user?.name || 'User'}
        onLogout={onLogout}
      />

      <div className="switch-buttons">
        <div className="inline-actions">
          {onBack && <button onClick={onBack}>Back to Dashboard</button>}
        </div>
      </div>

      <main className="booking-page">
        <header className="booking-header">
          <h1>Create Recurring Office Hours</h1>
          <p className="booking-subtitle">
            Create a weekly recurring office-hour series. Saved sessions can be edited directly on the right.
          </p>
        </header>

        {message && <p className="notice success">{message}</p>}
        {error && <p className="notice error">{error}</p>}

        <section className="booking-layout">
          <section className="card booking-form">
            <h2>Current Recurring Office Hours Draft</h2>

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

            <label>
              Repeat Weeks
              <input
                type="number"
                name="weeks"
                min="1"
                value={type3Draft.weeks}
                onChange={handleFormChange}
              />
            </label>

            <div className="same-line-row type3-four-column-row">
              <label>
                Start Date & Time
                <input
                  type="datetime-local"
                  name="start"
                  min={minDateTimeLocal}
                  value={slotEditor.start}
                  onChange={handleEditorChange}
                />
              </label>

              <label>
                End Date & Time
                <input
                  type="datetime-local"
                  name="end"
                  min={minDateTimeLocal}
                  value={slotEditor.end}
                  onChange={handleEditorChange}
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
              Use the left side to create new recurring office-hour sessions. Use the right side to edit existing saved ones.
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
            <h2> Summary</h2>

            {loadingOwnerSlots ? (
              <p>Loading summary...</p>
            ) : (
              <div className="saved-invitees-box" style={{ marginBottom: '14px' }}>
                <p><strong>Total sessions:</strong> {sortedSavedSlots.length}</p>
                <p><strong>Total capacity:</strong> {totalCapacity}</p>
                <p><strong>Total reserved:</strong> {totalReserved}</p>
                <p><strong>Still available seats:</strong> {totalAvailableSeats}</p>
              </div>
            )}

            <h2>Saved Recurring Office Hours</h2>

            {loadingOwnerSlots ? (
              <p>Loading your sessions...</p>
            ) : sortedSavedSlots.length === 0 ? (
              <p>No sessions saved yet.</p>
            ) : (
              <div className="summary-list summary-list-scroll">
                {sortedSavedSlots.map((slot) => {
                  const isExpanded = String(expandedSlotId) === String(slot.id);
                  const isEditing = String(editingSlotId) === String(slot.id);
                  const editForm = savedSlotEditForms[slot.id] || {
                    title: slot.title || '',
                    description: slot.notes || '',
                    start: toDateTimeLocalValue(slot.start),
                    end: toDateTimeLocalValue(slot.end),
                    capacity: slot.capacity ?? 1,
                  };

                  return (
                    <div
                      key={slot.id}
                      className={`saved-meeting-card ${isExpanded ? 'selected-summary-item' : ''}`}
                    >
                      <div className="saved-meeting-header">
                        <div
                          className="saved-meeting-header-main"
                          role="button"
                          tabIndex={0}
                          onClick={() => handleToggleSavedSlot(slot.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              handleToggleSavedSlot(slot.id);
                            }
                          }}
                        >
                          <p className="summary-title">{slot.title || 'Office Hour'}</p>
                          <p>Start: {formatReadableDateTime(slot.start)}</p>
                          <p>End: {formatReadableDateTime(slot.end)}</p>
                          <p>Reserved: {slot.bookedCount || 0} / {slot.capacity || 1}</p>
                        </div>

                        <div className="inline-actions saved-meeting-actions">
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => handleEditSavedSlot(slot)}
                          >
                            {isEditing ? 'Close Edit' : 'Edit'}
                          </button>

                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setDeleteConfirmSlotId(slot.id)}
                            disabled={deletingSlotId === slot.id}
                          >
                            {deletingSlotId === slot.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="saved-meeting-expanded">
                          {isEditing ? (
                            <div className="saved-invitees-box collapsible-section">
                              <p className="summary-title">Edit Session</p>

                              <label>
                                Title
                                <input
                                  type="text"
                                  value={editForm.title}
                                  onChange={(event) =>
                                    handleSavedSlotEditFieldChange(slot.id, 'title', event.target.value)
                                  }
                                />
                              </label>

                              <label style={{ marginTop: '10px' }}>
                                Description
                                <textarea
                                  value={editForm.description}
                                  onChange={(event) =>
                                    handleSavedSlotEditFieldChange(slot.id, 'description', event.target.value)
                                  }
                                />
                              </label>

                              <div className="same-line-row type3-four-column-row" style={{ marginTop: '10px' }}>
                                <label>
                                  Start Date & Time
                                  <input
                                    type="datetime-local"
                                    min={minDateTimeLocal}
                                    value={editForm.start}
                                    onChange={(event) =>
                                      handleSavedSlotEditFieldChange(slot.id, 'start', event.target.value)
                                    }
                                  />
                                </label>

                                <label>
                                  End Date & Time
                                  <input
                                    type="datetime-local"
                                    min={minDateTimeLocal}
                                    value={editForm.end}
                                    onChange={(event) =>
                                      handleSavedSlotEditFieldChange(slot.id, 'end', event.target.value)
                                    }
                                  />
                                </label>

                                <label>
                                  Capacity
                                  <input
                                    type="number"
                                    min="1"
                                    value={editForm.capacity}
                                    onChange={(event) =>
                                      handleSavedSlotEditFieldChange(slot.id, 'capacity', event.target.value)
                                    }
                                  />
                                </label>
                              </div>

                              <div className="inline-actions" style={{ marginTop: '10px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSavedSlot(slot.id)}
                                  disabled={updatingSlotId === slot.id}
                                >
                                  {updatingSlotId === slot.id ? 'Saving...' : 'Save Changes'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="saved-invitees-box collapsible-section">
                              <p className="summary-title">Session Details</p>
                              <p>Title: {slot.title || 'Office Hour'}</p>
                              <p>Description: {slot.notes || 'No description.'}</p>
                              <p>Start: {formatReadableDateTime(slot.start)}</p>
                              <p>End: {formatReadableDateTime(slot.end)}</p>
                              <p>Capacity: {slot.capacity || 1}</p>
                              <p>Reserved: {slot.bookedCount || 0} / {slot.capacity || 1}</p>
                            </div>
                          )}
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
              Existing sessions loaded from the backend and your unsaved recurring preview are shown together here.
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