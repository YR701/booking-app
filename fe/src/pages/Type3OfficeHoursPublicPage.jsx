/* Author: Hanjing Zheng */

import { useMemo, useState } from 'react';
import './SchedulerPages.css';
import UserCalendarTopnav from '../components/CalendarTopnav';
import CalendarGrid from '../components/CalendarGrid';

function addDays(dateInput, days) {
  const next = new Date(dateInput);
  next.setDate(next.getDate() + days);
  return next;
}

function formatReadableDateTime(dateInput) {
  const date = new Date(dateInput);
  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function generateWeeklyPublicSlots(baseSlots, weeks) {
  const safeWeeks = Math.max(1, Number(weeks) || 1);
  const allSlots = [];

  baseSlots.forEach((slot) => {
    const baseStart = new Date(slot.start);
    const baseEnd = new Date(slot.end);

    for (let weekIndex = 0; weekIndex < safeWeeks; weekIndex += 1) {
      const repeatedStart = addDays(baseStart, weekIndex * 7);
      const repeatedEnd = addDays(baseEnd, weekIndex * 7);

      allSlots.push({
        id: `${slot.id}-week-${weekIndex + 1}`,
        baseSlotId: slot.id,
        title: slot.title,
        start: repeatedStart,
        end: repeatedEnd,
        bookedBy: null,
        weekIndex: weekIndex + 1,
      });
    }
  });

  return allSlots.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
}

function Type3OfficeHoursPublicPage({ onBack, onLogout, user, type3Draft }) {
  const [bookedSlotIds, setBookedSlotIds] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const publicSlots = useMemo(() => {
    return generateWeeklyPublicSlots(type3Draft.savedBaseSlots, type3Draft.weeks);
  }, [type3Draft]);

  const calendarEvents = useMemo(() => {
    return publicSlots.map((slot) => ({
      id: slot.id,
      title: bookedSlotIds.includes(slot.id)
        ? `${slot.title} (Booked)`
        : slot.title,
      start: slot.start,
      end: slot.end,
      extendedProps: {
        baseSlotId: slot.baseSlotId,
        weekIndex: slot.weekIndex,
        isBooked: bookedSlotIds.includes(slot.id),
      },
    }));
  }, [publicSlots, bookedSlotIds]);

  const selectedSlot = useMemo(() => {
    return publicSlots.find((slot) => slot.id === selectedSlotId) || null;
  }, [publicSlots, selectedSlotId]);

  const handleBookSlot = (slotId) => {
    setMessage('');
    setError('');

    if (bookedSlotIds.includes(slotId)) {
      setError('This slot is already booked.');
      return;
    }

    setBookedSlotIds((current) => [...current, slotId]);
    setMessage('Slot booked successfully in frontend preview.');
  };

  const handleCalendarEventClick = (calendarEvent) => {
    setSelectedSlotId(calendarEvent.id);
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
          <h1>Available Office Hours</h1>
          <p className="booking-subtitle">
            Browse available recurring office-hour sessions and select one to book.
          </p>
        </header>

        {message && <p className="notice success">{message}</p>}
        {error && <p className="notice error">{error}</p>}

        <section className="booking-layout">
          <section className="card booking-side-panel">
            <h2>Available Sessions</h2>

            {publicSlots.length === 0 ? (
              <p>No office-hour sessions are available yet.</p>
            ) : (
              <div className="summary-list summary-list-scroll">
                {publicSlots.map((slot) => {
                  const isBooked = bookedSlotIds.includes(slot.id);
                  const isSelected = selectedSlotId === slot.id;

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
                        <p>Start: {formatReadableDateTime(slot.start)}</p>
                        <p>End: {formatReadableDateTime(slot.end)}</p>
                        <p>Week {slot.weekIndex}</p>
                        <p>Status: {isBooked ? 'Booked' : 'Available'}</p>
                      </div>

                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => handleBookSlot(slot.id)}
                        disabled={isBooked}
                      >
                        {isBooked ? 'Booked' : 'Book'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="card booking-side-panel">
            <h2>Selected Session</h2>

            {!selectedSlot ? (
              <p>Select a session from the list or calendar.</p>
            ) : (
              <div className="summary-list">
                <div className="summary-item">
                  <div className="summary-main">
                    <p className="summary-title">{selectedSlot.title}</p>
                    <p>Start: {formatReadableDateTime(selectedSlot.start)}</p>
                    <p>End: {formatReadableDateTime(selectedSlot.end)}</p>
                    <p>Week {selectedSlot.weekIndex}</p>
                    <p>
                      Status:{' '}
                      {bookedSlotIds.includes(selectedSlot.id) ? 'Booked' : 'Available'}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => handleBookSlot(selectedSlot.id)}
                    disabled={bookedSlotIds.includes(selectedSlot.id)}
                  >
                    {bookedSlotIds.includes(selectedSlot.id) ? 'Booked' : 'Book'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </section>

        <section className="card calendar-section">
          <div className="calendar-section-header">
            <h2>Calendar View</h2>
            <p>
              Click a session on the calendar to select it. Booked sessions are marked in
              the calendar title.
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