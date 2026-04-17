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

function createMailto(email) {
  return `mailto:${email}`;
}

function Type3OfficeHoursPublicPage({ onBack, onLogout, user, onOpenType2Vote, onOpenUserDashboard }) {
  const [publicSlots, setPublicSlots] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservingSlotId, setReservingSlotId] = useState(null);
  const [cancelingSlotId, setCancelingSlotId] = useState(null);
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

  const selectedOwner = useMemo(() => {
    return availableOwners.find(
      (ownerItem) => String(ownerItem.id) === String(selectedOwnerId)
    ) || null;
  }, [availableOwners, selectedOwnerId]);

  const ownerSlots = useMemo(() => {
    if (!selectedOwnerId) return [];

    return publicSlots
      .filter((slot) => String(slot.owner?.id) === String(selectedOwnerId))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [publicSlots, selectedOwnerId]);

  const availableSlots = useMemo(() => {
    return ownerSlots.filter((slot) => slot.isAvailable && !slot.reservedByMe);
  }, [ownerSlots]);

  const myReservedSlots = useMemo(() => {
    return ownerSlots.filter((slot) => slot.reservedByMe);
  }, [ownerSlots]);

  const calendarEvents = useMemo(() => {
    if (!selectedOwnerId) return [];

    return ownerSlots.map((slot) => ({
      id: String(slot.id),
      title: slot.reservedByMe
        ? `${slot.title} (Reserved by me)`
        : `${slot.title} (${slot.bookedCount || 0}/${slot.capacity || 1})`,
      start: slot.start,
      end: slot.end,
      extendedProps: {
        capacity: slot.capacity || 1,
        bookedCount: slot.bookedCount || 0,
        isAvailable: slot.isAvailable,
        isFull: slot.isFull,
        reservedByMe: slot.reservedByMe,
        ownerName: slot.owner?.name || '',
        ownerEmail: slot.owner?.email || '',
      },
    }));
  }, [ownerSlots, selectedOwnerId]);

  const selectedSlot = useMemo(() => {
    return ownerSlots.find(
      (slot) => String(slot.id) === String(selectedSlotId)
    ) || null;
  }, [ownerSlots, selectedSlotId]);

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

      setSelectedSlotId(slotId);
    } catch (reserveError) {
      console.error(reserveError);
      setError(reserveError.message || 'Unable to reserve Type 3 slot.');
    } finally {
      setReservingSlotId(null);
    }
  };

  const handleCancelReservation = async (slotId) => {
    try {
      setMessage('');
      setError('');
      setCancelingSlotId(slotId);

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('You must be logged in to cancel a Type 3 reservation.');
      }

      const response = await fetch(`${API_BASE}/type3/slots/${slotId}/book`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel Type 3 reservation.');
      }

      setMessage(data.message || 'Type 3 reservation canceled successfully.');

      setPublicSlots((current) =>
        current.map((slot) =>
          String(slot.id) === String(slotId) ? data.slot : slot
        )
      );

      setSelectedSlotId(slotId);
    } catch (cancelError) {
      console.error(cancelError);
      setError(cancelError.message || 'Unable to cancel Type 3 reservation.');
    } finally {
      setCancelingSlotId(null);
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
            Select a professor first, then browse that professor’s office-hour sessions.
            Reserved sessions stay visible below and on the calendar.
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
                Choose a professor to see only that professor’s Type 3 office hours.
              </p>
            )}

            <div className="invitee-preview-box">
              <p className="summary-title">Current Filter</p>
              <p>
                {selectedOwner
                  ? `Showing office hours for ${selectedOwner.name}.`
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
            ) : availableSlots.length === 0 ? (
              <p>No available office-hour sessions for this professor.</p>
            ) : (
              <div className="summary-list summary-list-scroll">
                {availableSlots.map((slot) => {
                  const isSelected = String(selectedSlotId) === String(slot.id);

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
                        <p>Status: {slot.isFull ? 'Full' : 'Available'}</p>
                      </div>

                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => handleReserveSlot(slot.id)}
                        disabled={reservingSlotId === slot.id}
                      >
                        {reservingSlotId === slot.id ? 'Reserving...' : 'Reserve'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </section>

        <section className="card booking-side-panel" style={{ marginBottom: '24px' }}>
          <h2>My Reserved Sessions</h2>

          {!selectedOwnerId ? (
            <p>Please select a professor first.</p>
          ) : myReservedSlots.length === 0 ? (
            <p>You have not reserved any Type 3 session for this professor.</p>
          ) : (
            <div className="summary-list summary-list-scroll">
              {myReservedSlots.map((slot) => {
                const isSelected = String(selectedSlotId) === String(slot.id);

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
                      <p>Reserved: Reserved by you</p>
                      <p>Status: {slot.isFull ? 'Full' : 'Reserved by you'}</p>
                    </div>

                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => handleCancelReservation(slot.id)}
                      disabled={cancelingSlotId === slot.id}
                    >
                      {cancelingSlotId === slot.id ? 'Canceling...' : 'Cancel Reservation'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="card booking-side-panel" style={{ marginBottom: '24px' }}>
          <h2>Selected Session</h2>

          {!selectedSlot ? (
            <p>Select a session from the list or calendar.</p>
          ) : (
            <div className="summary-list summary-list-scroll">
              <div className="summary-item">
                <div className="summary-main">
                  <p className="summary-title">{selectedSlot.title}</p>
                  <p>Professor: {selectedSlot.owner?.name || 'Unknown'}</p>
                  <p>Professor Email: {selectedSlot.owner?.email || 'N/A'}</p>
                  <p>Start: {formatReadableDateTime(selectedSlot.start)}</p>
                  <p>End: {formatReadableDateTime(selectedSlot.end)}</p>
                  <p>Reserved: {selectedSlot.bookedCount || 0} / {selectedSlot.capacity || 1}</p>
                  <p>
                    Status:{' '}
                    {selectedSlot.reservedByMe
                      ? 'Reserved by you'
                      : selectedSlot.isFull
                        ? 'Full'
                        : 'Available'}
                  </p>
                </div>

                {selectedSlot.reservedByMe ? (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => handleCancelReservation(selectedSlot.id)}
                    disabled={cancelingSlotId === selectedSlot.id}
                  >
                    {cancelingSlotId === selectedSlot.id ? 'Canceling...' : 'Cancel Reservation'}
                  </button>
                ) : (
                  selectedSlot.isAvailable && (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => handleReserveSlot(selectedSlot.id)}
                      disabled={reservingSlotId === selectedSlot.id}
                    >
                      {reservingSlotId === selectedSlot.id ? 'Reserving...' : 'Reserve'}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </section>

        <section className="card calendar-section">
          <div className="calendar-section-header">
            <h2>Calendar View</h2>
            <p>
              After selecting a professor, that professor’s sessions are shown on the calendar.
              Your reserved sessions stay visible and are labeled separately.
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