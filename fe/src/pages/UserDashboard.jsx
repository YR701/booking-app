/* Author: Yongrong Yang */
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