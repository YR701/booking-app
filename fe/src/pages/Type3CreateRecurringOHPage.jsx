/* Author: Hanjing Zheng */





// import { useMemo, useState } from 'react';
// import './BookingPages.css';
// import UserCalendarTopnav from '../components/CalendarTopnav';
// import CalendarGrid from '../components/CalendarGrid';

// function toDateTimeLocalValue(dateInput) {
//   const date = new Date(dateInput);
//   if (Number.isNaN(date.getTime())) return '';

//   const offset = date.getTimezoneOffset();
//   const localDate = new Date(date.getTime() - offset * 60 * 1000);
//   return localDate.toISOString().slice(0, 16);
// }

// function formatReadableDateTime(dateInput) {
//   const date = new Date(dateInput);
//   return date.toLocaleString([], {
//     dateStyle: 'medium',
//     timeStyle: 'short',
//   });
// }

// function addDays(dateInput, days) {
//   const next = new Date(dateInput);
//   next.setDate(next.getDate() + days);
//   return next;
// }

// function generateWeeklyRepeatedEvents(baseSlots, weeks) {
//   const safeWeeks = Math.max(1, Number(weeks) || 1);
//   const allEvents = [];

//   baseSlots.forEach((slot) => {
//     const baseStart = new Date(slot.start);
//     const baseEnd = new Date(slot.end);

//     for (let weekIndex = 0; weekIndex < safeWeeks; weekIndex += 1) {
//       const repeatedStart = addDays(baseStart, weekIndex * 7);
//       const repeatedEnd = addDays(baseEnd, weekIndex * 7);

//       allEvents.push({
//         id: `${slot.id}-week-${weekIndex + 1}`,
//         title: weekIndex === 0 ? 'Office Hour' : `Office Hour (Week ${weekIndex + 1})`,
//         start: repeatedStart,
//         end: repeatedEnd,
//         extendedProps: {
//           baseSlotId: slot.id,
//           weekIndex: weekIndex + 1,
//           isSavedRecurringSlot: true,
//         },
//       });
//     }
//   });

//   return allEvents;
// }

// function Type3CreateRecurringOHPage({ onBack, onLogout, user }) {
//   const defaultEditor = {
//     start: '',
//     end: '',
//   };

//   const [formData, setFormData] = useState({
//     title: 'COMP 307 Office Hours',
//     description: '',
//     weeks: 4,
//   });

//   const [savedBaseSlots, setSavedBaseSlots] = useState([]);
//   const [selectedSavedSlotId, setSelectedSavedSlotId] = useState(null);
//   const [slotEditor, setSlotEditor] = useState(defaultEditor);
//   const [message, setMessage] = useState('');
//   const [error, setError] = useState('');

//   const isEditorComplete = useMemo(() => {
//     if (!slotEditor.start || !slotEditor.end) return false;

//     const start = new Date(slotEditor.start);
//     const end = new Date(slotEditor.end);

//     return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
//   }, [slotEditor]);

//   const savedEvents = useMemo(() => {
//     return generateWeeklyRepeatedEvents(savedBaseSlots, formData.weeks);
//   }, [savedBaseSlots, formData.weeks]);

//   const unsavedPreviewEvents = useMemo(() => {
//     if (!isEditorComplete) return [];

//     const tempSlot = {
//       id: 'unsaved-preview-slot',
//       start: new Date(slotEditor.start),
//       end: new Date(slotEditor.end),
//     };

//     return generateWeeklyRepeatedEvents([tempSlot], formData.weeks).map((eventItem) => ({
//       ...eventItem,
//       id: `preview-${eventItem.id}`,
//       title:
//         eventItem.extendedProps.weekIndex === 1
//           ? 'Unsaved Preview'
//           : `Unsaved Preview (Week ${eventItem.extendedProps.weekIndex})`,
//       extendedProps: {
//         ...eventItem.extendedProps,
//         isUnsavedPreview: true,
//       },
//     }));
//   }, [slotEditor, formData.weeks, isEditorComplete]);

//   const calendarEvents = useMemo(() => {
//     return [...savedEvents, ...unsavedPreviewEvents];
//   }, [savedEvents, unsavedPreviewEvents]);

//   const sortedSavedSlots = useMemo(() => {
//     return [...savedBaseSlots].sort(
//       (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
//     );
//   }, [savedBaseSlots]);

//   const handleFormChange = (event) => {
//     const { name, value } = event.target;
//     setFormData((current) => ({
//       ...current,
//       [name]: value,
//     }));
//     setMessage('');
//     setError('');
//   };

//   const resetEditor = () => {
//     setSelectedSavedSlotId(null);
//     setSlotEditor(defaultEditor);
//   };

//   const handleEditorChange = (event) => {
//     const { name, value } = event.target;

//     setSlotEditor((current) => ({
//       ...current,
//       [name]: value,
//     }));

//     setMessage('');
//     setError('');
//   };

//   const validateEditor = () => {
//     if (!slotEditor.start || !slotEditor.end) {
//       return 'Please choose both start and end date/time.';
//     }

//     const start = new Date(slotEditor.start);
//     const end = new Date(slotEditor.end);

//     if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
//       return 'Please enter valid date/time values.';
//     }

//     if (end <= start) {
//       return 'End time must be after start time.';
//     }

//     return '';
//   };

//   const handleCalendarSelect = ({ start, end }) => {
//     setSlotEditor({
//       start: toDateTimeLocalValue(start),
//       end: toDateTimeLocalValue(end),
//     });

//     setSelectedSavedSlotId(null);
//     setMessage('');
//     setError('');
//   };

//   const handleCalendarEventClick = (calendarEvent) => {
//     if (calendarEvent.extendedProps?.isUnsavedPreview) {
//       return;
//     }

//     const baseSlotId = calendarEvent.extendedProps?.baseSlotId;
//     if (!baseSlotId) return;

//     const matchedSavedSlot = savedBaseSlots.find((slot) => slot.id === baseSlotId);
//     if (!matchedSavedSlot) return;

//     setSelectedSavedSlotId(baseSlotId);
//     setSlotEditor({
//       start: toDateTimeLocalValue(matchedSavedSlot.start),
//       end: toDateTimeLocalValue(matchedSavedSlot.end),
//     });
//     setMessage('');
//     setError('');
//   };

//   const handleSaveRecurringOfficeHours = () => {
//     setMessage('');
//     setError('');

//     const validationMessage = validateEditor();
//     if (validationMessage) {
//       setError(validationMessage);
//       return;
//     }

//     const start = new Date(slotEditor.start);
//     const end = new Date(slotEditor.end);

//     if (selectedSavedSlotId) {
//       setSavedBaseSlots((current) =>
//         current.map((slot) =>
//           slot.id === selectedSavedSlotId
//             ? {
//                 ...slot,
//                 start,
//                 end,
//               }
//             : slot
//         )
//       );
//       setMessage('Recurring office-hour slot updated.');
//     } else {
//       const duplicateExists = savedBaseSlots.some(
//         (slot) =>
//           new Date(slot.start).getTime() === start.getTime() &&
//           new Date(slot.end).getTime() === end.getTime()
//       );

//       if (duplicateExists) {
//         setError('This recurring slot already exists.');
//         return;
//       }

//       const newSlot = {
//         id: `saved-slot-${Date.now()}`,
//         start,
//         end,
//       };

//       setSavedBaseSlots((current) => [...current, newSlot]);
//       setMessage('Recurring office-hour slot saved.');
//     }

//     resetEditor();
//   };

//   const handleRemoveSavedSlot = (slotId) => {
//     setSavedBaseSlots((current) => current.filter((slot) => slot.id !== slotId));

//     if (selectedSavedSlotId === slotId) {
//       resetEditor();
//     }

//     setMessage('Recurring office-hour slot removed.');
//     setError('');
//   };

//   const handleStartNewSelection = () => {
//     resetEditor();
//     setMessage('');
//     setError('');
//   };

//   const handleSubmitAllDraft = (event) => {
//     event.preventDefault();
//     setMessage('');
//     setError('');

//     if (savedBaseSlots.length === 0) {
//       setError('Please save at least one recurring office-hour slot first.');
//       return;
//     }

//     const weeks = Number(formData.weeks);
//     if (!weeks || weeks < 1) {
//       setError('Repeat weeks must be at least 1.');
//       return;
//     }

//     const payload = {
//       title: formData.title,
//       description: formData.description,
//       repeatWeeklyForWeeks: weeks,
//       savedRecurringBaseSlots: savedBaseSlots.map((slot) => ({
//         start: new Date(slot.start).toISOString(),
//         end: new Date(slot.end).toISOString(),
//       })),
//       previewOccurrences: savedEvents.map((eventItem) => ({
//         start: new Date(eventItem.start).toISOString(),
//         end: new Date(eventItem.end).toISOString(),
//         weekIndex: eventItem.extendedProps.weekIndex,
//         baseSlotId: eventItem.extendedProps.baseSlotId,
//       })),
//     };

//     console.log('Final Type 3 payload:', payload);
//     setMessage('Draft prepared. Check console output.');
//   };

//   return (
//     <>
//       <UserCalendarTopnav
//         userEmail={user?.email}
//         onLogout={onLogout}
//         onBackHome={onBack}
//       />

//       <main className="booking-page">
//         <header className="booking-header">
//           <h1>Create Recurring Office Hours</h1>
//           <p className="booking-subtitle">
//             Choose an exact first start and end time, preview it immediately on the
//             calendar, and save it as a weekly recurring office-hour slot when ready.
//           </p>
//         </header>

//         {message && <p className="notice success">{message}</p>}
//         {error && <p className="notice error">{error}</p>}

//         <section className="booking-layout">
//           <form className="card booking-form" onSubmit={handleSubmitAllDraft}>
//             <h2>Recurring Office Hours Settings</h2>

//             <label>
//               Title
//               <input
//                 type="text"
//                 name="title"
//                 value={formData.title}
//                 onChange={handleFormChange}
//                 placeholder="Enter office hours title"
//               />
//             </label>

//             <label>
//               Description
//               <textarea
//                 name="description"
//                 value={formData.description}
//                 onChange={handleFormChange}
//                 placeholder="Optional short description"
//               />
//             </label>

//             <div className="same-line-row">
//               <label>
//                 Start Date & Time
//                 <input
//                   type="datetime-local"
//                   name="start"
//                   value={slotEditor.start}
//                   onChange={handleEditorChange}
//                 />
//               </label>

//               <label>
//                 End Date & Time
//                 <input
//                   type="datetime-local"
//                   name="end"
//                   value={slotEditor.end}
//                   onChange={handleEditorChange}
//                 />
//               </label>

//               <label>
//                 Repeat Weekly For
//                 <input
//                   type="number"
//                   name="weeks"
//                   min="1"
//                   value={formData.weeks}
//                   onChange={handleFormChange}
//                 />
//               </label>
//             </div>

//             <p className="helper-text">
//               When the start time, end time, and repeat weeks are filled correctly,
//               an unsaved preview appears on the calendar. Click <strong>Save Recurring Office Hours</strong>
//               to save that recurring slot. After saving, the editor resets for a new selection.
//             </p>

//             <div className="inline-actions">
//               <button
//                 type="button"
//                 className="button secondary"
//                 onClick={handleStartNewSelection}
//               >
//                 New Selection
//               </button>

//               <button
//                 type="button"
//                 onClick={handleSaveRecurringOfficeHours}
//               >
//                 Save Recurring Office Hours
//               </button>
//             </div>

//             <div className="form-actions">
//               <button type="submit" className="button secondary">
//                 Prepare Final Draft Payload
//               </button>
//             </div>
//           </form>

//           <section className="card booking-side-panel">
//             <h2>Saved Recurring Slots</h2>

//             {sortedSavedSlots.length === 0 ? (
//               <p>No recurring slots saved yet.</p>
//             ) : (
//               <div className="summary-list">
//                 {sortedSavedSlots.map((slot) => {
//                   const isSelected = slot.id === selectedSavedSlotId;

//                   return (
//                     <div
//                       key={slot.id}
//                       className={`summary-item ${isSelected ? 'selected-summary-item' : ''}`}
//                     >
//                       <div
//                         className="summary-main"
//                         role="button"
//                         tabIndex={0}
//                         onClick={() => {
//                           setSelectedSavedSlotId(slot.id);
//                           setSlotEditor({
//                             start: toDateTimeLocalValue(slot.start),
//                             end: toDateTimeLocalValue(slot.end),
//                           });
//                           setMessage('');
//                           setError('');
//                         }}
//                         onKeyDown={(event) => {
//                           if (event.key === 'Enter' || event.key === ' ') {
//                             setSelectedSavedSlotId(slot.id);
//                             setSlotEditor({
//                               start: toDateTimeLocalValue(slot.start),
//                               end: toDateTimeLocalValue(slot.end),
//                             });
//                             setMessage('');
//                             setError('');
//                           }
//                         }}
//                       >
//                         <p className="summary-title">Saved Weekly Slot</p>
//                         <p>Start: {formatReadableDateTime(slot.start)}</p>
//                         <p>End: {formatReadableDateTime(slot.end)}</p>
//                         <p>Repeated weekly for {Math.max(1, Number(formData.weeks) || 1)} week(s)</p>
//                       </div>

//                       <button
//                         type="button"
//                         className="button secondary"
//                         onClick={() => handleRemoveSavedSlot(slot.id)}
//                       >
//                         Remove
//                       </button>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </section>
//         </section>

//         <section className="card calendar-section">
//           <div className="calendar-section-header">
//             <h2>Calendar Preview</h2>
//             <p>
//               Select a time range on the calendar to fill the editor above. That creates
//               only a temporary preview until you click <strong>Save Recurring Office Hours</strong>.
//               Click a saved calendar event to load it back into the editor for editing.
//             </p>
//           </div>

//           <CalendarGrid
//             mode="type3-create"
//             events={calendarEvents}
//             onSelectSlot={handleCalendarSelect}
//             onSelectEvent={handleCalendarEventClick}
//           />
//         </section>
//       </main>
//     </>
//   );
// }

// export default Type3CreateRecurringOHPage;




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
        title: displayTitle,
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

function Type3CreateRecurringOHPage({ onBack, onLogout, user }) {
  const defaultEditor = {
    start: '',
    end: '',
  };

  const [formData, setFormData] = useState({
    title: 'COMP 307 Office Hours',
    description: '',
    weeks: 4,
  });

  const [savedBaseSlots, setSavedBaseSlots] = useState([]);
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
    return generateWeeklyRepeatedEvents(savedBaseSlots, formData.weeks, formData.title);
  }, [savedBaseSlots, formData.weeks, formData.title]);

  const unsavedPreviewEvents = useMemo(() => {
    if (!isEditorComplete) return [];

    const tempSlot = {
      id: 'unsaved-preview-slot',
      start: new Date(slotEditor.start),
      end: new Date(slotEditor.end),
    };

    const previewTitle = formData.title?.trim() || 'Office Hour';

    return generateWeeklyRepeatedEvents([tempSlot], formData.weeks, previewTitle).map((eventItem) => ({
      ...eventItem,
      id: `preview-${eventItem.id}`,
      title: previewTitle,
      extendedProps: {
        ...eventItem.extendedProps,
        isUnsavedPreview: true,
      },
    }));
  }, [slotEditor, formData.weeks, formData.title, isEditorComplete]);

  const calendarEvents = useMemo(() => {
    return [...savedEvents, ...unsavedPreviewEvents];
  }, [savedEvents, unsavedPreviewEvents]);

  const sortedSavedSlots = useMemo(() => {
    return [...savedBaseSlots].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [savedBaseSlots]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
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

    const matchedSavedSlot = savedBaseSlots.find((slot) => slot.id === baseSlotId);
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
      setSavedBaseSlots((current) =>
        current.map((slot) =>
          slot.id === selectedSavedSlotId
            ? {
                ...slot,
                title: formData.title.trim() || 'Office Hour',
                start,
                end,
              }
            : slot
        )
      );
      setMessage('Recurring office-hour slot updated.');
    } else {
      const duplicateExists = savedBaseSlots.some(
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
        title: formData.title.trim() || 'Office Hour',
        start,
        end,
      };

      setSavedBaseSlots((current) => [...current, newSlot]);
      setMessage('Recurring office-hour slot saved.');
    }

    resetEditor();
  };

  const handleRemoveSavedSlot = (slotId) => {
    setSavedBaseSlots((current) => current.filter((slot) => slot.id !== slotId));

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

  const handleSubmitAllDraft = (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (savedBaseSlots.length === 0) {
      setError('Please save at least one recurring office-hour slot first.');
      return;
    }

    const weeks = Number(formData.weeks);
    if (!weeks || weeks < 1) {
      setError('Repeat weeks must be at least 1.');
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      repeatWeeklyForWeeks: weeks,
      savedRecurringBaseSlots: savedBaseSlots.map((slot) => ({
        title: slot.title,
        start: new Date(slot.start).toISOString(),
        end: new Date(slot.end).toISOString(),
      })),
      previewOccurrences: savedEvents.map((eventItem) => ({
        title: eventItem.title,
        start: new Date(eventItem.start).toISOString(),
        end: new Date(eventItem.end).toISOString(),
        weekIndex: eventItem.extendedProps.weekIndex,
        baseSlotId: eventItem.extendedProps.baseSlotId,
      })),
    };

    console.log('Final Type 3 payload:', payload);
    setMessage('Draft prepared. Check console output.');
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
          <form className="card booking-form" onSubmit={handleSubmitAllDraft}>
            <h2>Recurring Office Hours Settings</h2>

            <label>
              Title
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="Enter office hours title"
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={formData.description}
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
                  value={formData.weeks}
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

            <div className="form-actions">
              <button type="submit" className="button secondary">
                Prepare Final Draft Payload
              </button>
            </div>
          </form>

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
                        <p>Repeated weekly for {Math.max(1, Number(formData.weeks) || 1)} week(s)</p>
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