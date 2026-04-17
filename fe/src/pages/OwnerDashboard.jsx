// Author: Jenny Hua

import './OwnerDashboard.css';
import './switchButton.css';
import DashboardTopnav from '../components/DashboardTopnav';
import Type1OwnerIncomingRequest from './Type1OwnerIncomingRequest';
import { useState } from 'react';

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
  onToggleSlot,
  onDeleteSlot,
  formatDateTime,
  createMailto,
  onLogout,
  user,
  message,
  error,
  onOpenType2Create,
  onOpenType2Results,
  onOpenType3Create,
  onOpenType3Owner,
  onSwitchToUserDashboard,
  onOpenBookingPage,
  onRefreshData,
}) {
  const [inviteStatus, setInviteStatus] = useState('');
  const totalSlots = myOwnerSlots.length;
  const publicSlots = myOwnerSlots.filter((slot) => slot.isActive).length;
  const bookedSlots = myOwnerSlots.filter((slot) => slot.bookedBy).length;
  const pendingRequests = ownerRequests.filter((request) => request.status === 'Pending').length;

  async function handleCopyInvitationUrl() {
    if (!invitationUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(invitationUrl);
      setInviteStatus('Invitation link copied.');
    } catch {
      setInviteStatus('Could not copy link automatically.');
    }
  }

  return (
    <div>
      <DashboardTopnav
        userEmail={user?.email || 'owner@mcgill.ca'}
        userName={user?.name || 'Owner'}
        onLogout={onLogout}
      />

      <div className="switch-buttons">
        <div className="inline-actions">
          {onOpenType2Create && (
            <button type="button" onClick={onOpenType2Create}>
              Type 2 Create a Group Meeting
            </button>
          )}
          {onOpenType2Results && (
            <button type="button" onClick={onOpenType2Results}>
              Type 2 Group Meeting Vote Results
            </button>
          )}
          {onOpenType3Create && (
            <button type="button" onClick={onOpenType3Create}>
              Type 3 Create Office Hours Slots
            </button>
          )}
          {onOpenType3Owner && (
            <button type="button" onClick={onOpenType3Owner}>
              Type 3 Owner's Office Hours
            </button>
          )}
          {onSwitchToUserDashboard && (
            <button type="button" onClick={onSwitchToUserDashboard}>
              Switch to User Dashboard
            </button>
          )}
          {onOpenBookingPage && (
            <button type="button" onClick={onOpenBookingPage}>
              Preview Booking Page
            </button>
          )}
        </div>
      </div>

      {message && <div className="notice success">{message}</div>}
      {error && <div className="notice error">{error}</div>}
      {inviteStatus && <div className="notice success">{inviteStatus}</div>}

      <section className="card owner-summary">
        <div>
          <h2>Owner overview</h2>
          <p>{user?.name || 'Owner'}</p>
          <p>{user?.email || 'owner@mcgill.ca'}</p>
        </div>
        <div className="owner-summary-stats">
          <div className="owner-stat">
            <strong>{totalSlots}</strong>
            <span>Total slots</span>
          </div>
          <div className="owner-stat">
            <strong>{publicSlots}</strong>
            <span>Public slots</span>
          </div>
          <div className="owner-stat">
            <strong>{bookedSlots}</strong>
            <span>Booked slots</span>
          </div>
          <div className="owner-stat">
            <strong>{pendingRequests}</strong>
            <span>Pending requests</span>
          </div>
        </div>
      </section>

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
          <div className="owner-invite-bar">
            <p className="invite-link">Invitation URL: {invitationUrl || 'Loading...'}</p>
            <div className="actions">
              <button type="button" onClick={handleCopyInvitationUrl} disabled={!invitationUrl}>
                Copy link
              </button>
              {invitationUrl && (
                <a className="button secondary" href={invitationUrl}>
                  Open invite link
                </a>
              )}
            </div>
          </div>

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
                  {slot.bookedBy?.email && <p>{slot.bookedBy.email}</p>}

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

      <Type1OwnerIncomingRequest
        ownerRequests={ownerRequests}
        onRefreshData={onRefreshData}
      />
    </div>
  );
}

export default OwnerDashboard;