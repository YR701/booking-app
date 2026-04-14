// Author: Jenny Hua
import './OwnerDashboard.css';
import DashboardTopnav from '../components/DashboardTopnav';

/**
 * Owner-only UI: create private slots, invitation URL, manage slots.
 * Wired from App.jsx with shared API handlers.
 */
function OwnerDashboard({
  slotForm,
  setSlotForm,
  onCreateSlot,
  myOwnerSlots,
  invitationUrl,
  ownerRequests,
  onApproveRequest,
  onRejectRequest,
  onToggleSlot,
  onDeleteSlot,
  formatDateTime,
  createMailto,
  onLogout,
  user,
  message,
  error,
  onOpenType2Create,
  onOpenType3Create,
  onOpenType3Owner,
}) {
  return (
    <div>
      <DashboardTopnav
        userEmail={user?.email || 'owner@mcgill.ca'}
        userName={user?.name || 'Owner'}
        onLogout={onLogout}
      />

          <div className="testing-nav-buttons" style={{ padding: '16px 24px 0' }}>
      <h2>Testing Pages</h2>
      <div className="inline-actions">
        {onOpenType2Create && (
          <button type="button" onClick={onOpenType2Create}>
            Type 2 Create
          </button>
        )}
        {onOpenType3Create && (
          <button type="button" onClick={onOpenType3Create}>
            Type 3 Create
          </button>
        )}
        {onOpenType3Owner && (
          <button type="button" onClick={onOpenType3Owner}>
            Type 3 Owner
          </button>
        )}
      </div>
    </div>


      {message && <div className="notice success">{message}</div>}
      {error && <div className="notice error">{error}</div>}
      <section className="owner-dashboard grid two">
        <form className="card form" onSubmit={onCreateSlot}>
          <h2>Create slot</h2>
          <input
            placeholder="Slot title"
            value={slotForm.title}
            onChange={(event) =>
              setSlotForm({ ...slotForm, title: event.target.value })
            }
          />
          <input
            type="date"
            value={slotForm.date}
            onChange={(event) =>
              setSlotForm({ ...slotForm, date: event.target.value })
            }
          />
          <input
            type="time"
            value={slotForm.startTime}
            onChange={(event) =>
              setSlotForm({ ...slotForm, startTime: event.target.value })
            }
          />
          <input
            type="time"
            value={slotForm.endTime}
            onChange={(event) =>
              setSlotForm({ ...slotForm, endTime: event.target.value })
            }
          />
          <button type="submit">Create private slot</button>
        </form>

        <section className="card">
          <h2>Owner slots</h2>
          <p className="invite-link">Invitation URL: {invitationUrl || 'Loading...'}</p>
          {myOwnerSlots.length === 0 ? (
            <p>No slots created yet.</p>
          ) : (
            <div className="list">
              {myOwnerSlots.map((slot) => (
                <div className="item" key={slot.id}>
                  <p><strong>{slot.title}</strong></p>
                  <p>{formatDateTime(slot.start)}</p>
                  <p>{slot.isActive ? 'Public' : 'Private'}</p>
                  <p>
                    {slot.bookedBy
                      ? `Booked by ${slot.bookedBy.name}`
                      : 'Not booked'}
                  </p>
                  <div className="actions">
                    <button type="button" onClick={() => onToggleSlot(slot)}>
                      {slot.isActive ? 'Make private' : 'Activate'}
                    </button>
                    {slot.bookedBy && (
                      <a
                        className="button secondary"
                        href={createMailto(
                          slot.bookedBy.email,
                          `Regarding ${slot.title}`,
                          'Hello,',
                        )}
                      >
                        Email student
                      </a>
                    )}
                    <button type="button" onClick={() => onDeleteSlot(slot)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>

      <section className="card request-panel">
        <h2>Incoming Meeting Requests</h2>
        {ownerRequests?.length === 0 ? (
          <p>No incoming requests.</p>
        ) : (
          <div className="list">
            {ownerRequests.map((request) => (
              <div className="item" key={request.id}>
                <p><strong>{request.title}</strong></p>
                <p>From: {request.requester?.name || 'Unknown'} ({request.requester?.email || 'N/A'})</p>
                <p>{formatDateTime(request.start)} - {formatDateTime(request.end)}</p>
                <p>Status: {request.status}</p>
                <p>{request.reason}</p>
                {request.status === 'Pending' && (
                  <div className="actions">
                    <button type="button" onClick={() => onApproveRequest(request.id)}>
                      Approve
                    </button>
                    <button type="button" onClick={() => onRejectRequest(request.id)}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default OwnerDashboard;
