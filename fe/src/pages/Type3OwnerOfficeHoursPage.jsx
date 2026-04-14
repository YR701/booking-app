/* Author: Hanjing Zheng */

import { useMemo } from 'react';
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

function generateWeeklyEvents(baseSlots, weeks) {
  const safeWeeks = Math.max(1, Number(weeks) || 1);
  const events = [];

  baseSlots.forEach((slot) => {
    const baseStart = new Date(slot.start);
    const baseEnd = new Date(slot.end);

    for (let i = 0; i < safeWeeks; i += 1) {
      events.push({
        id: `${slot.id}-week-${i + 1}`,
        title: slot.title,
        start: addDays(baseStart, i * 7),
        end: addDays(baseEnd, i * 7),
        extendedProps: {
          baseSlotId: slot.id,
          weekIndex: i + 1,
        },
      });
    }
  });

  return events;
}

function Type3OwnerOfficeHoursPage({ onBack, onLogout, user, type3Draft }) {
  const calendarEvents = useMemo(() => {
    return generateWeeklyEvents(type3Draft.savedBaseSlots, type3Draft.weeks);
  }, [type3Draft]);

  return (
    <>
      <UserCalendarTopnav
        userEmail={user?.email}
        onLogout={onLogout}
        onBackHome={onBack}
      />

      <main className="booking-page">
        <header className="booking-header">
          <h1>My Recurring Office Hours</h1>
          <p className="booking-subtitle">
            View all saved recurring office-hour slots and their weekly occurrences.
          </p>
        </header>

        <section className="booking-layout">
          <section className="card booking-side-panel">
            <h2>Recurring Slots</h2>

            {type3Draft.savedBaseSlots.length === 0 ? (
              <p>No recurring slots created yet.</p>
            ) : (
              <div className="summary-list">
                {type3Draft.savedBaseSlots.map((slot) => (
                  <div key={slot.id} className="summary-item">
                    <div className="summary-main">
                      <p className="summary-title">{slot.title}</p>
                      <p>Start: {formatReadableDateTime(slot.start)}</p>
                      <p>End: {formatReadableDateTime(slot.end)}</p>
                      <p>Repeats weekly for {type3Draft.weeks} week(s)</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card booking-side-panel">
            <h2>Summary</h2>
            <p><strong>Title:</strong> {type3Draft.title}</p>
            <p><strong>Description:</strong> {type3Draft.description || 'None'}</p>
            <p><strong>Total recurring slots:</strong> {type3Draft.savedBaseSlots.length}</p>
            <p><strong>Total generated sessions:</strong> {type3Draft.savedBaseSlots.length * Math.max(1, Number(type3Draft.weeks) || 1)}</p>
          </section>
        </section>

        <section className="card calendar-section">
          <div className="calendar-section-header">
            <h2>Calendar View</h2>
            <p>All weekly repeated office-hour sessions are shown here.</p>
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