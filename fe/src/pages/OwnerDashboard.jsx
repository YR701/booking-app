// Author: Jenny Hua

import './OwnerDashboard.css';
import './switchButton.css';
import DashboardTopnav from '../components/DashboardTopnav';
import Type1OwnerIncomingRequest from './Type1OwnerIncomingRequest';
import { useEffect, useState } from 'react';
import { API_BASE, TOKEN_KEY } from '../config';
import { getDateTimeLocalNow } from '../utils/dateTimeLocal';

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
  onSwitchToUserDashboard,
  onOpenBookingPage,
  onRefreshData,
}) {
  const [inviteStatus, setInviteStatus] = useState('');
  const [overviewError, setOverviewError] = useState('');
  const [type2Stats, setType2Stats] = useState({ total: 0, finalized: 0 });
  const [type3Stats, setType3Stats] = useState({ total: 0, reserved: 0 });
  const totalSlots = myOwnerSlots.length;
  const publicSlots = myOwnerSlots.filter((slot) => slot.isActive).length;
  const bookedSlots = myOwnerSlots.filter((slot) => slot.bookedBy).length;
  const totalType1Requests = ownerRequests.length;
  const pendingRequests = ownerRequests.filter((request) => request.status === 'Pending').length;
  const nowLocal = getDateTimeLocalNow();
  const todayDate = nowLocal.slice(0, 10);
  const minStartTimeToday = nowLocal.slice(11, 16);
  const isTodaySelected = slotForm.date === todayDate;

  useEffect(() => {
    let cancelled = false;

    async function loadTypeOverviewStats() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        return;
      }

      const [type2Result, type3Result] = await Promise.allSettled([
        fetch(`${API_BASE}/type2/owner/meetings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/type3/owner/slots`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let nextOverviewError = '';
      let nextType2Stats = { total: 0, finalized: 0 };
      let nextType3Stats = { total: 0, reserved: 0 };

      if (type2Result.status === 'fulfilled' && type2Result.value.ok) {
        const data = await type2Result.value.json().catch(() => ({}));
        const meetings = data.meetings || [];
        nextType2Stats = {
          total: meetings.length,
          finalized: meetings.filter(
            (meeting) =>
              meeting.finalSlotId ||
              meeting.finalSlot?.id ||
              String(meeting.status || '').toLowerCase().includes('final')
          ).length,
        };
      } else {
        nextOverviewError = 'Some Type 2 / Type 3 overview stats could not be loaded.';
      }

      if (type3Result.status === 'fulfilled' && type3Result.value.ok) {
        const data = await type3Result.value.json().catch(() => ({}));
        const slots = data.slots || [];
        nextType3Stats = {
          total: slots.length,
          reserved: slots.reduce((sum, slot) => sum + Number(slot.bookedCount || 0), 0),
        };
      } else {
        nextOverviewError = 'Some Type 2 / Type 3 overview stats could not be loaded.';
      }

      if (!cancelled) {
        setType2Stats(nextType2Stats);
        setType3Stats(nextType3Stats);
        setOverviewError(nextOverviewError);
      }
    }

    void loadTypeOverviewStats();

    return () => {
      cancelled = true;
    };
  }, [user]);

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
              Create Group Meetings
            </button>
          )}
          {onOpenType2Results && (
            <button type="button" onClick={onOpenType2Results}>
              Group Meeting Vote Results
            </button>
          )}
          {onOpenType3Create && (
            <button type="button" onClick={onOpenType3Create}>
              Create Recurring Office Hours
            </button>
          )}
          {/* {onOpenType3Owner && (
            <button type="button" onClick={onOpenType3Owner}>
            Recurring Office Hours
            </button>
          )} */}
          {onSwitchToUserDashboard && (
            <button type="button" onClick={onSwitchToUserDashboard}>
              Switch to User
            </button>
          )}
        </div>
      </div>

      {message && <div className="notice success">{message}</div>}
      {error && <div className="notice error">{error}</div>}
      {inviteStatus && <div className="notice success">{inviteStatus}</div>}
      {overviewError && <div className="notice error">{overviewError}</div>}

      <section className="card owner-summary">
        <div>
          <h2>Owner overview</h2>
          <p>{user?.name || 'Owner'}</p>
          <p>{user?.email || 'owner@mcgill.ca'}</p>
        </div>
        <div className="owner-summary-stats">
          <div className="owner-stat">
            <strong>{totalSlots}</strong>
            <span>One-time slots</span>
          </div>
          <div className="owner-stat">
            <strong>{publicSlots}</strong>
            <span>Public one-time</span>
          </div>
          <div className="owner-stat">
            <strong>{bookedSlots}</strong>
            <span>Booked one-time</span>
          </div>
          <div className="owner-stat">
            <strong>{totalType1Requests}</strong>
            <span>Meeting requests total</span>
          </div>
          <div className="owner-stat">
            <strong>{pendingRequests}</strong>
            <span>Meeting requests pending</span>
          </div>
          <div className="owner-stat">
            <strong>{type2Stats.total}</strong>
            <span>Group meetings pending</span>
          </div>
          <div className="owner-stat">
            <strong>{type2Stats.finalized}</strong>
            <span>Group meetings finalized</span>
          </div>
          <div className="owner-stat">
            <strong>{type3Stats.total}</strong>
            <span>Office Hours slots</span>
          </div>
          <div className="owner-stat">
            <strong>{type3Stats.reserved}</strong>
            <span>Office Hours reserved</span>
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
            min={todayDate}
            onChange={(event) =>
              setSlotForm({ ...slotForm, date: event.target.value })
            }
          />
          <input
            type="time"
            value={slotForm.startTime}
            min={isTodaySelected ? minStartTimeToday : undefined}
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
              {invitationUrl && onOpenBookingPage && (
                <button type="button" className="button secondary" onClick={onOpenBookingPage}>
                  Preview Invite Link
                </button>
              )}
              {invitationUrl && !onOpenBookingPage && (
                <a className="button secondary" href={invitationUrl}>
                  Preview Invite Link
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