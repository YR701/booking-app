/* Author: Yongrong Yang */
import { useState } from 'react';
import './UserDashboard.css';
import DashboardTopnav from '../components/DashboardTopnav';

function formatSlotTimeRange(slot) {
  return `${new Date(slot.start).toLocaleDateString()} ${new Date(slot.start).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${new Date(slot.end).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function UserDashboard({
  handleLogout,
  user,
  myBookings = [],
  owners = [],
  slots = [],
  selectedOwnerId = '',
  selectedOwner = null,
  inviteOwnerId = '',
  onSelectOwner,
  onBookSlot,
  onCancelBooking,
  message = '',
  error = '',
  showOwnerBackButton = false,
  onBackToOwnerDashboard,
}) {
  const [requestForm, setRequestForm] = useState({
    startTime: '',
    endTime: '',
    reason: '',
  });
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');

  async function handleRequest(event) {
    event.preventDefault();
    setRequestMessage('');
    setRequestError('');

    if (!selectedOwner) {
      setRequestError('Please select an owner first.');
      return;
    }

    const { startTime, endTime, reason } = requestForm;
    if (!startTime || !endTime || !reason.trim()) {
      setRequestError('Please fill in all fields to request a meeting.');
      return;
    }

    if (startTime >= endTime) {
      setRequestError('Start time must be before end time.');
      return;
    }

    try {
      const token = localStorage.getItem('comp307-booking-token');
      const response = await fetch('http://localhost:4000/api/meetings/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ownerId: selectedOwner.id,
          title: `Meeting Request with ${selectedOwner.name}`,
          startTime,
          endTime,
          reason: reason.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request a meeting.');
      }

      setRequestMessage(data.message || 'Meeting request sent successfully.');
      setRequestForm({ startTime: '', endTime: '', reason: '' });
    } catch (requestErr) {
      console.error(requestErr);
      setRequestError(requestErr.message);
    }
  }

  return (
    <div>
      <DashboardTopnav
        userEmail={user?.email || 'user@mail.mcgill.ca'}
        userName={user?.name || 'Student'}
        onLogout={handleLogout}
      />
      {showOwnerBackButton && (
        <div className="dashboard-actions">
          <button type="button" onClick={onBackToOwnerDashboard}>
            Back to owner dashboard
          </button>
        </div>
      )}
      {message && <div className="notice success">{message}</div>}
      {error && <div className="notice error">{error}</div>}
      {requestMessage && <div className="notice success">{requestMessage}</div>}
      {requestError && <div className="notice error">{requestError}</div>}

      <div className="appointment">
        <h1>My Appointments</h1>
        {myBookings.length === 0 ? (
          <p>No appointments booked.</p>
        ) : (
          myBookings.map((appointment) => (
            <div className="appointment-info" key={appointment.id}>
              <div>
                <h2>{appointment.title}</h2>
                <p>{appointment.owner?.name}</p>
                <p>{formatSlotTimeRange(appointment)}</p>
              </div>
              <div className="appointment-buttons">
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `mailto:${appointment.owner?.email}`;
                  }}
                >
                  Email owner
                </button>
                <button type="button" onClick={() => onCancelBooking(appointment.id)}>
                  Cancel
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="OwnerInfo">
        <h1>{inviteOwnerId ? 'Invitation booking page' : 'All available slots'}</h1>
        {!inviteOwnerId && (
          <div className="owner-list">
            <select name="owners" id="owners" onChange={(event) => onSelectOwner(event.target.value)} value={selectedOwnerId || ''}>
              <option value="">-- Select an owner --</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedOwner ? (
          <div>
            <h2>Available Slots</h2>
            <div className="owner-info">
              <div className="owner-header">
                <div>
                  <h2>{selectedOwner.name}</h2>
                  <h3>{selectedOwner.email}</h3>
                </div>
                <div className="owner-contact">
                  <button
                    className="email-button"
                    type="button"
                    onClick={() => {
                      window.location.href = `mailto:${selectedOwner.email}`;
                    }}
                  >
                    Send Message
                  </button>
                </div>
              </div>

              {slots.length === 0 ? (
                <p>No active slots available.</p>
              ) : (
                <div className="slots-list">
                  {slots.map((slot) => (
                    <div className="slots-item" key={slot.id}>
                      <div>
                        <strong>{slot.title}</strong>
                        <p className="slot-time">{formatSlotTimeRange(slot)}</p>
                      </div>
                      {slot.bookedBy ? (
                        <p>Reserved</p>
                      ) : (
                        <button type="button" onClick={() => onBookSlot(slot.id)}>
                          Book Office Hour
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="request-meeting">
                <h3>Request a Meeting with {selectedOwner.name}</h3>
                <form className="request-form" onSubmit={handleRequest}>
                  <div className="request-form-item">
                    <label htmlFor="startTime">From</label>
                    <input
                      type="datetime-local"
                      id="startTime"
                      value={requestForm.startTime}
                      onChange={(event) =>
                        setRequestForm((current) => ({
                          ...current,
                          startTime: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="request-form-item">
                    <label htmlFor="endTime">To</label>
                    <input
                      type="datetime-local"
                      id="endTime"
                      value={requestForm.endTime}
                      onChange={(event) =>
                        setRequestForm((current) => ({
                          ...current,
                          endTime: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="request-form-item">
                    <input
                      type="text"
                      id="reason"
                      placeholder="Reason for meeting"
                      className="request-reason"
                      value={requestForm.reason}
                      onChange={(event) =>
                        setRequestForm((current) => ({
                          ...current,
                          reason: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <button type="submit">Submit</button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <p>Please select an owner to see available time slots.</p>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;