/* Author: Yongrong Yang */

import { API_BASE, TOKEN_KEY } from '../config';
import './UserDashboard.css';
import './switchButton.css';
import DashboardTopnav from '../components/DashboardTopnav';
import { useState, useEffect } from 'react';
import { openQuestionMail } from '../utils/mailtoSlots';
import { formatDateTimeRange } from '../utils/formatTime';
import { fetchOfficeHourSlots, handleBookOfficeHour } from '../utils/OfficeHour';

function UserDashboard({
  onLogout,
  user,
  onOpenType2Vote,
  onOpenType2Results,
  onOpenType3Public,
  owners = [],
  myBookings = [],//type1
  onBookSlot,
  onCancelBooking,
  loading = false,
  message = '',
  error = '',
  onSwitchToOwnerDashboard,
}) {
  const [selectedOwnerId, setSelectedOwnerId] = useState(null);

  const [myOfficehours, setmyOfficehours] = useState([]);
  const [myGroupmeeting, setmyGroupmeeting] = useState([]);

  const [oneTimeSlots, setOneTimeSlots] = useState([]);
  const [officeHourSlots, setOfficeHourSlots] = useState([]);
  const [currentOwner, setCurrentOwner] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedRequestOwnerId, setSelectedRequestOwnerId] = useState('');
  const [expandedAppointmentSection, setExpandedAppointmentSection] = useState('one-time');
  const [expandedAvailableSection, setExpandedAvailableSection] = useState('one-time-slots');
  const [slotFilterDate, setSlotFilterDate] = useState('');

  const [localMessage, setLocalMessage] = useState('');
  const [localError, setLocalError] = useState('');

  // Toggle functions for accordion sections
  const toggleAppointmentSection = (sectionKey) => {
    setExpandedAppointmentSection((current) =>
      current === sectionKey ? '' : sectionKey
    );
  };

  const toggleAvailableSection = (sectionKey) => {
    setExpandedAvailableSection((current) =>
      current === sectionKey ? '' : sectionKey
    );
  };

  const clearSlotFilters = () => {
    setSlotFilterDate('');
  };

  useEffect(() => {
    fetchRequests();
    fetchMyGroupmeeting();
    fetchMyOfficeHour();
  }, []);

  //fetch function for type 2 appointments
  const fetchMyGroupmeeting = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/type2/me/finalized-meetings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch your booked group meeting');
      }
      const data = await response.json();
      setmyGroupmeeting(data.meetings || []);
      setLocalError('');
    } catch (error) {
      console.error(error);
      setLocalError('Error loading your booked group meeting. Please try again later.');
      setmyGroupmeeting([]);
    }
  };

  //fetch function for type 3 appointments
  const fetchMyOfficeHour = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/type3/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch your booked office hour');
      }
      const data = await response.json();
      setmyOfficehours(data.bookedSlots || []);
      setLocalError('');
    } catch (error) {
      console.error(error);
      setLocalError('Error loading your booked office hour. Please try again later.');
      setmyOfficehours([]);
    }
  };

  //cancel OfficeHour
  const onCancelOfficeHour = async (id) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/type3/slots/${id}/book`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('Failed to cancel appointment');
      }
      setLocalMessage('Appointment canceled successfully');
      setLocalError('');

      await fetchMyOfficeHour();

      //if the user selected the same owner in the available slot section, also referesh the slots
      if (selectedOwnerId) {
        await loadOfficeHourSlots(selectedOwnerId);
      }
    } catch (error) {
      console.error(error);
      setLocalError('Error canceling appointment. Please try again later.');
      setLocalMessage('');
    }
  };



  //Type 1 request a meeting function
  const handleRequest = async () => {
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const reason = document.getElementById('reason').value;
    const ownerId = selectedRequestOwnerId;

    if (!startTime || !endTime || !reason || !ownerId) {
      setLocalError('Please fill in all fields to request a meeting.');
      setLocalMessage('');
      return;
    }
    if (startTime >= endTime) {
      setLocalError('Start time must be before end time.');
      setLocalMessage('');
      return;
    }

    const selectedOwner = owners.find(owner => String(owner.id) === String(ownerId));
    if (!selectedOwner) {
      setLocalError('Invalid owner selected.');
      setLocalMessage('');
      return;
    }

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/meetings/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ownerId: ownerId,
          title: 'Meeting Request',
          startTime: startTime,
          endTime: endTime,
          reason: reason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request a meeting');
      }

      setLocalMessage('Meeting request sent successfully');
      setLocalError('');

      document.getElementById('startTime').value = '';
      document.getElementById('endTime').value = '';
      document.getElementById('reason').value = '';
      setSelectedRequestOwnerId('');

      await fetchRequests();

      // special mailto style, so here we do it manually instead of using the helper function
      const subject = 'New Meeting Request';
      const body = `You have a new meeting request from ${user.name} (${user.email}).\n\n
      Reason: ${reason}\n\n
      Requested Time: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}`;
      if (selectedOwner.email) {
        const params = new URLSearchParams({ subject, body });
        window.location.href = `mailto:${selectedOwner.email}?${params.toString()}`;
      }
    } catch (error) {
      console.error(error);
      setLocalError(error.message);
      setLocalMessage('');
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/meetings/requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel request');
      }

      setLocalMessage('Meeting request canceled successfully');
      setLocalError('');
      await fetchRequests();
    } catch (error) {
      console.error(error);
      setLocalError(error.message || 'Error canceling request. Please try again later.');
      setLocalMessage('');
    }
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/meetings/requests`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      const data = await response.json();
      setRequests(data.requests);
      setLocalError('');
    } catch (error) {
      console.error(error);
      setLocalError('Error loading requests. Please try again later.');
      setRequests([]);
    }
  };

  const handleOwnerChange = async (event) => {
    const value = event.target.value;

    if (value === '') {
      setSelectedOwnerId(null);
      setCurrentOwner(null);
      setOneTimeSlots([]);
      setOfficeHourSlots([]);
    } else {
      setSelectedOwnerId(value);
      await fetchOneTimeSlots(value);
      await loadOfficeHourSlots(value);
    }
  };

  const fetchOneTimeSlots = async (ownerId) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/owners/${ownerId}/slots`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.warn('Failed to fetch one-time slots:', response.status);
        setOneTimeSlots([]);
        return;
      }

      const data = await response.json();
      const slots = data.slots || [];
      slots.sort((a, b) => new Date(a.start) - new Date(b.start));
      setOneTimeSlots(slots);
      setCurrentOwner(data.owner);
      setLocalError('');
    } catch (error) {
      console.error('Error fetching one-time slots:', error);
      setOneTimeSlots([]);
    }
  };

  const loadOfficeHourSlots = async (ownerId) => {
    const { slots, owner, error } = await fetchOfficeHourSlots(ownerId);

    if (error) {
      setLocalError(error);
    } else {
      setOfficeHourSlots(slots);
      setLocalError('');
      if (owner) {
        setCurrentOwner(owner);
      }
    }
  };

  const bookOfficeHour = async (slotId) => {
    const result = await handleBookOfficeHour(slotId);
    if (result.success) {
      setLocalMessage(result.message);
      setLocalError('');

      if (selectedOwnerId) {
        await loadOfficeHourSlots(selectedOwnerId);
      }
      await fetchMyOfficeHour();
    } else {
      setLocalError(result.message);
      setLocalMessage('');
    }
  };

  // Advanced function to filter slots by date 

  const filterSlotsByDate = (slotsList, filterDate) => {
    const normalizedFilterDate = filterDate || '';

    return slotsList.filter((slot) => {
      const slotStart = new Date(slot.start);

      if (Number.isNaN(slotStart.getTime())) {
        return false;
      }

      if (!normalizedFilterDate) {
        return true;
      }

      const slotDateString = slotStart.toISOString().slice(0, 10);
      return slotDateString === normalizedFilterDate;
    });
  };

  const filteredOneTimeSlots = filterSlotsByDate(oneTimeSlots, slotFilterDate);
  const filteredOfficeHourSlots = filterSlotsByDate(officeHourSlots, slotFilterDate);

  return (
    <>
      <DashboardTopnav
        userEmail={user?.email || 'user@mail.mcgill.ca'}
        userName={user?.name || 'Student'}
        onLogout={onLogout}
      />

      <div className="switch-buttons">
        <div className="inline-actions">
          {onOpenType2Vote && (
            <button type="button" onClick={onOpenType2Vote}>
              Group Meeting Vote
            </button>
          )}
          {onOpenType2Results && (
            <button type="button" onClick={onOpenType2Results}>
              Group Meeting Results
            </button>
          )}
          {onOpenType3Public && (
            <button type="button" onClick={onOpenType3Public}>
              Office Hour Booking
            </button>
          )}
          {user?.role === 'owner' && onSwitchToOwnerDashboard && (
            <button type="button" onClick={onSwitchToOwnerDashboard}>
              Return to Owner
            </button>
          )}
        </div>
      </div>

      {message && <div className="notice success">{message}</div>}
      {error && <div className="notice error">{error}</div>}
      {localMessage && <div className="notice success">{localMessage}</div>}
      {localError && <div className="notice error">{localError}</div>}

      <div className="appointment">
        <h1>My Appointments</h1>

        <section className="accordion-section">
          <button
            type="button"
            className="accordion-header"
            onClick={() => toggleAppointmentSection('one-time')}
          >
            <span>My One-time Appointments</span>
            <span>{myBookings.length}</span>
          </button>

          {expandedAppointmentSection === 'one-time' && (
            <div className="accordion-content">
              {loading ? (
                <p>Loading appointments...</p>
              ) : myBookings.length === 0 ? (
                <p>No appointments booked.</p>
              ) : (
                <div className="list-scroll">
                  {myBookings.map(appointment => (
                    <div className="appointment-info" key={appointment.id}>
                      <h2>{appointment.owner?.name}</h2>
                      <p>{appointment.title}</p>
                      <p>{formatDateTimeRange(appointment.start, appointment.end)}</p>
                      <div className="appointment-buttons">
                        <button onClick={() => openQuestionMail({
                          email: appointment.owner?.email,
                          ownerName: appointment.owner?.name,
                          topic: appointment.title || 'my appointment',
                          whenText: formatDateTimeRange(appointment.start, appointment.end),
                          senderName: user?.name || 'Student',
                        })}>
                          Email
                        </button>
                        <button onClick={() => onCancelBooking(appointment.id)}>Cancel</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="accordion-section">
          <button
            type="button"
            className="accordion-header"
            onClick={() => toggleAppointmentSection('requests')}
          >
            <span>My Meeting Requests Status</span>
            <span>{requests.length}</span>
          </button>

          {expandedAppointmentSection === 'requests' && (
            <div className="accordion-content">
              {requests.length === 0 ? (
                <p>No meeting requests.</p>
              ) : (
                <div className="list-scroll">
                  {requests.map(request => (
                    <div className="appointment-info" key={request.id}>
                      <h2>{request.owner?.name}</h2>
                      <p>{request.title}</p>
                      <p>{formatDateTimeRange(request.start, request.end)}</p>
                      <p>{request.status}</p>
                      {request.status === 'Pending' && (
                        <button type="button" onClick={() => handleCancelRequest(request.id)}>
                          Cancel request
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="accordion-section">
          <button
            type="button"
            className="accordion-header"
            onClick={() => toggleAppointmentSection('group')}
          >
            <span>My Group Meeting</span>
            <span>{myGroupmeeting.length}</span>
          </button>

          {expandedAppointmentSection === 'group' && (
            <div className="accordion-content">
              {myGroupmeeting.length === 0 ? (
                <p>No office hours booked.</p>
              ) : (
                <div className="list-scroll">
                  {myGroupmeeting.map(meeting => (
                    <div className="appointment-info" key={meeting.id}>
                      <h2>{meeting.owner?.name}</h2>
                      <p>{meeting.title}</p>
                      <p>{formatDateTimeRange(meeting.finalSlot?.start, meeting.finalSlot?.end)}</p>
                      <div className="appointment-buttons">
                        <button onClick={() => openQuestionMail({
                          email: meeting.owner?.email,
                          ownerName: meeting.owner?.name,
                          topic: meeting.title || 'group meeting',
                          whenText: meeting.finalSlot?.start && meeting.finalSlot?.end
                            ? formatDateTimeRange(meeting.finalSlot.start, meeting.finalSlot.end)
                            : '',
                          senderName: user?.name || 'Student',
                        })}>
                          Email
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="accordion-section">
          <button
            type="button"
            className="accordion-header"
            onClick={() => toggleAppointmentSection('office-hours')}
          >
            <span>My Office Hours</span>
            <span>{myOfficehours.length}</span>
          </button>

          {expandedAppointmentSection === 'office-hours' && (
            <div className="accordion-content">
              {myOfficehours.length === 0 ? (
                <p>No office hours booked.</p>
              ) : (
                <div className="list-scroll">
                  {myOfficehours.map(oh => (
                    <div className="appointment-info" key={oh.id}>
                      <h2>{oh.owner?.name}</h2>
                      <p>{oh.title}</p>
                      <p>{formatDateTimeRange(oh.start, oh.end)}</p>
                      <div className="appointment-buttons">
                        <button onClick={() => openQuestionMail({
                          email: oh.owner?.email,
                          ownerName: oh.owner?.name,
                          topic: oh.title || 'office hour',
                          whenText: formatDateTimeRange(oh.start, oh.end),
                          senderName: user?.name || 'Student',
                        })}>
                          Email
                        </button>
                        <button onClick={() => onCancelOfficeHour(oh.id)}>Cancel</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="request-meeting">
        <h3>Request a Meeting </h3>
        <div className='request-form'>
          <div className='request-form-item'>

            <label>Select a Professor</label>
            <select id="ownersID" value={selectedRequestOwnerId}
              onChange={(e) => setSelectedRequestOwnerId(e.target.value)}>
              <option value="">-- Select an owner --</option>
              {owners.map(owner => (
                <option key={owner.id} value={owner.id} disabled={user?.role === 'owner' && owner.id === user.id}>
                  {owner.name} {user?.role === 'owner' && owner.id === user.id && '(You)'}
                </option>
              ))}
            </select>

            <div className='request-form-item'>
              <label htmlFor="time">From</label>
              <input type="datetime-local" id="startTime" />
            </div>
            <div className='request-form-item'>
              <label htmlFor="time">To</label>
              <input type="datetime-local" id="endTime" />
            </div>
            <div className='request-form-item'>
              <input type="text" id="reason" placeholder="Reason for meeting" className='request-reason' />
            </div>
            <button onClick={handleRequest}>Submit</button>
          </div>
        </div>
      </div>

      <div className="OwnerInfo">
        <h1>All available slots</h1>
        <div className='owner-list'>
          <select name="owners" id="owners" onChange={handleOwnerChange} value={selectedOwnerId || ''}>
            <option value="">-- Select an owner --</option>
            {owners.map(owner => (
              <option key={owner.id} value={owner.id} disabled={user?.role === 'owner' && owner.id === user.id}>
                {owner.name}{user?.role === 'owner' && owner.id === user.id && '(You)'}
              </option>
            ))}
          </select>
        </div>

        {currentOwner !== null ? (
          <div>
            <h2>Available Slots</h2>
            <div className="owner-info">
              <div className="owner-header">
                <div>
                  <h2>{currentOwner.name}</h2>
                  <h3>{currentOwner.email}</h3>
                </div>
                <div className="owner-contact">
                  <button className="email-button" onClick={() =>
                    openQuestionMail({
                      email: currentOwner.email,
                      ownerName: currentOwner.name,
                      topic: 'booking availability',
                      senderName: user?.name || 'Student',
                    })}>
                    Send Message
                  </button>
                </div>
              </div>

              <div className="slot-filter-toolbar">
                <label>
                  Date
                  <input
                    type="date"
                    value={slotFilterDate}
                    onChange={(event) => setSlotFilterDate(event.target.value)}
                  />
                </label>
                <button type="button" className="slot-filter-clear" onClick={clearSlotFilters}>
                  Clear
                </button>
              </div>

              <div>
                <h3>One-time Slots</h3>
                <section className="accordion-section">
                  <button
                    type="button"
                    className="accordion-header"
                    onClick={() => toggleAvailableSection('one-time-slots')}
                  >
                    <span>One-time Slots</span>
                    <span>{filteredOneTimeSlots.length}</span>
                  </button>

                  {expandedAvailableSection === 'one-time-slots' && (
                    <div className="accordion-content">
                      {filteredOneTimeSlots.length === 0 ? (
                        <p>No one-time slots available.</p>
                      ) : (
                        <div className="list-scroll">
                          <div className='slots-list'>
                            {filteredOneTimeSlots.map((slot) => (
                              <div className='slots-item' key={slot.id}>
                                <p className="slot-time">{formatDateTimeRange(slot.start, slot.end)}</p>
                                <button onClick={() => onBookSlot(slot.id)}>Book Appointment</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>

              <div>
                <h3>Office Hours</h3>
                <section className="accordion-section">
                  <button
                    type="button"
                    className="accordion-header"
                    onClick={() => toggleAvailableSection('office-hour-slots')}
                  >
                    <span>Office Hours</span>
                    <span>{filteredOfficeHourSlots.length}</span>
                  </button>

                  {expandedAvailableSection === 'office-hour-slots' && (
                    <div className="accordion-content">
                      {filteredOfficeHourSlots.length === 0 ? (
                        <p>No office hours available.</p>
                      ) : (
                        <div className="list-scroll">
                          <div className='slots-list'>
                            {filteredOfficeHourSlots.map((slot) => (
                              <div className='slots-item' key={slot.id}>
                                <p className="slot-time">{formatDateTimeRange(slot.start, slot.end)}</p>
                                <button onClick={() => bookOfficeHour(slot.id)}>Book Office Hour</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        ) : (
          <p>Please select an owner to see available time slots.</p>
        )}
      </div>
    </>
  );
}

export default UserDashboard;