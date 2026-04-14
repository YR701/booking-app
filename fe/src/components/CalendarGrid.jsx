/* Author: Hanjing Zheng */

import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import './CalendarGrid.css';

function CalendarGrid({
  mode = 'readonly',
  events = [],
  onSelectSlot,
  onSelectEvent,
}) {
  const selectable =
    mode === 'type2-create' ||
    mode === 'type2-vote' ||
    mode === 'type3-create';

  const handleSelect = (selectionInfo) => {
    if (!onSelectSlot) return;

    onSelectSlot({
      start: selectionInfo.start,
      end: selectionInfo.end,
      allDay: selectionInfo.allDay,
    });
  };

  return (
    <div className="calendar-grid-shell">
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay',
        }}
        selectable={selectable}
        selectMirror={true}
        select={handleSelect}
        events={events}
        eventClick={(clickInfo) => {
          if (onSelectEvent) {
            onSelectEvent(clickInfo.event);
          }
        }}
        allDaySlot={false}
        height="90vh"

        slotEventOverlap={false}

        /* show full-day range, but open near 08:00 */
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        scrollTime="08:00:00"
        scrollTimeReset={false}

        /* finer selection / display */
        slotDuration="00:15:00"
        snapDuration="00:05:00"

        /* 24-hour time formatting */
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}

        /* optional visual improvements */
        nowIndicator={true}
        expandRows={true}
        dayHeaderFormat={{
          weekday: 'short',
          month: 'numeric',
          day: 'numeric',
        }}
      />
    </div>
  );
}

export default CalendarGrid;