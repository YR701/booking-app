/* Author: Hanjing Zheng */

import { API_BASE, TOKEN_KEY } from '../config';
import { useEffect, useMemo, useState } from 'react';
import './SchedulerPages.css';
import UserCalendarTopnav from '../components/CalendarTopnav';
import CalendarGrid from '../components/CalendarGrid';

function formatReadableDateTime(dateInput) {
  const date = new Date(dateInput);
  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function Type3OwnerOfficeHoursPage({ onBack, onLogout, user }) {
  const [ownerSlots, setOwnerSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingSlotId, setDeletingSlotId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchOwnerSlots = async () => {
    try {
      setLoading(true);

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
        throw new Error(data.error || 'Failed to fetch owner Type 3 slots.');
      }

      setOwnerSlots(data.slots || []);
      setError('');
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || 'Unable to load your Type 3 sessions.');
      setOwnerSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOwnerSlots();
  }, [user]);

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
      setMessage('Type 3 slot deleted successfully.');
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError.message || 'Unable to delete Type 3 slot.');
    } finally {
      setDeletingSlotId(null);
    }
  };

  const sortedOwnerSlots = useMemo(() => {
    return [...ownerSlots].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [ownerSlots]);

  const calendarEvents = useMemo(() => {
    return sortedOwnerSlots.map((slot) => ({
      id: String(slot.id),
      title: `${slot.title} (${slot.bookedCount || 0}/${slot.capacity || 1})`,
      start: slot.start,
      end: slot.end,
      extendedProps: {
        capacity: slot.capacity || 1,
        bookedCount: slot.bookedCount || 0,
      },
    }));
  }, [sortedOwnerSlots]);

  const totalCapacity = useMemo(() => {
    return sortedOwnerSlots.reduce(
      (sum, slot) => sum + Number(slot.capacity || 0),
      0
    );
  }, [sortedOwnerSlots]);

  const totalReserved = useMemo(() => {
    return sortedOwnerSlots.reduce(
      (sum, slot) => sum + Number(slot.bookedCount || 0),
      0
    );
  }, [sortedOwnerSlots]);

  return (
    <>
      <UserCalendarTopnav
        userEmail={user?.email}
        onLogout={onLogout}
        onBackHome={onBack}
      />

      <main className="booking-page">
        <header className="booking-header">
          <h1>My Type 3 Office Hours</h1>
          <p className="booking-subtitle">
            This page loads only the Type 3 sessions you created from the backend.
          </p>
        </header>

        {message && <p className="notice success">{message}</p>}
        {error && <p className="notice error">{error}</p>}

        <section className="booking-layout">
          <section className="card booking-side-panel">
            <h2>My Type 3 Sessions</h2>

            {loading ? (
              <p>Loading your Type 3 sessions...</p>
            ) : sortedOwnerSlots.length === 0 ? (
              <p>No Type 3 sessions created yet.</p>
            ) : (
              <div className="summary-list summary-list-scroll">
                {sortedOwnerSlots.map((slot) => (
                  <div key={slot.id} className="summary-item">
                    <div className="summary-main">
                      <p className="summary-title">{slot.title}</p>
                      <p>Start: {formatReadableDateTime(slot.start)}</p>
                      <p>End: {formatReadableDateTime(slot.end)}</p>
                      <p>Reserved: {slot.bookedCount || 0} / {slot.capacity || 1}</p>
                      <p>Status: {slot.isAvailable ? 'Available' : 'Full'}</p>
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
                ))}
              </div>
            )}
          </section>

          <section className="card booking-side-panel">
            <h2>Summary</h2>
            {loading ? (
              <p>Loading summary...</p>
            ) : (
              <>
                <p><strong>Total sessions:</strong> {sortedOwnerSlots.length}</p>
                <p><strong>Total capacity:</strong> {totalCapacity}</p>
                <p><strong>Total reserved:</strong> {totalReserved}</p>
                <p><strong>Still available seats:</strong> {Math.max(0, totalCapacity - totalReserved)}</p>
              </>
            )}
          </section>
        </section>

        <section className="card calendar-section">
          <div className="calendar-section-header">
            <h2>Calendar View</h2>
            <p>Only your own Type 3 sessions are shown here.</p>
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

export default Type3OwnerOfficeHoursPage;