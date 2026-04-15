/* Author: Yongrong Yang */

import { API_BASE, TOKEN_KEY } from '../config';
import './UserDashboard.css';
import './switchButton.css';
import DashboardTopnav from '../components/DashboardTopnav';
//import UserCalendar from '../components/UserCalendar';
import { useState, useEffect } from 'react';
import { buildMailto } from '../utils/mailto';
import { formatDateTimeRange } from '../utils/formatTime';
import { fetchOfficeHourSlots } from '../utils/fetchOfficeHourSlots';

// function UserDashboard({ onLogout, user }) {
function UserDashboard({
  onLogout,
  user,
  onOpenType2Vote,
  onOpenType3Public,
  owners = [],
  myBookings = [],
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

  const [localMessage, setLocalMessage] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);


  //cancel appointment
  const onCancel = async (id) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/slots/${id}/booking`, {
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
      // Refresh will be handled by parent, or user can re-trigger
    } catch (error) {
      console.error(error);
      setLocalError('Error canceling appointment. Please try again later.');
      setLocalMessage('');
    }
  };

  const fetchMyOfficeHour = async (id) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/slots/myOfficeHour`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch your booked office hour');
      }
      const data = await response.json();
      setmyGroupmeeting(data.slots);
      setLocalError('');
    } catch (error) {
      console.error(error);
      setLocalError('Error loading your booked office hour. Please try again later.');
      setmyGroupmeeting([]);
    }
  };


  //request a meeting functions
  //handle request a meeting, send a message to the owner
  const handleRequest = async () => {
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const reason = document.getElementById('reason').value;
    // const ownerId = currentOwner.id;
    const ownerId = selectedRequestOwnerId;

    //verify the input info
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

    //verify the selected owner
    const selectedOwner = owners.find(owner => String(owner.id) === String(ownerId));
    if (!selectedOwner) {
      setLocalError('Invalid owner selected.');
      setLocalMessage('');
      return;
    }

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/api/meetings/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
        // throw new Error('Failed to request a meeting');
        throw new Error(errorData.error || 'Failed to request a meeting');
      }

      setLocalMessage('Meeting request sent successfully');
      setLocalError('');

      //clear the form
      document.getElementById('startTime').value = '';
      document.getElementById('endTime').value = '';
      document.getElementById('reason').value = '';
      setSelectedRequestOwnerId('');

      //update the request list
      await fetchRequests();

      //send email notification to the owner
      const subject = 'New Meeting Request';
      const body = `You have a new meeting request from ${user.name} (${user.email}).\n\n
      Reason: ${reason}\n\n
      Requested Time: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}`;
      const mailtoLink = buildMailto(selectedOwner.email, subject, body);
      //console.log('Generated mailto link:', mailtoLink);
      window.location.href = mailtoLink;

    } catch (error) {
      console.error(error);
      setLocalError(error.message);
      setLocalMessage('');
    }
  }

  //cancel a request
  const handleCancelRequest = async (requestId) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/meetings/requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
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

  //get all user's sent requests
  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/meetings/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      const data = await response.json();
      console.log('Requests data:', data.requests);
      setRequests(data.requests);
      setLocalError('');
    } catch (error) {
      console.error(error);
      setLocalError('Error loading requests. Please try again later.');
      setRequests([]);
    }
  };

  //All available slots sections: including owner create one-time slots and office hours

  //select different owner to see their available slots
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
  }

  //fetch the one-time slots of the selected owner
  const fetchOneTimeSlots = async (ownerId) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/owners/${ownerId}/slots`, {
        headers: {
          'Authorization': `Bearer ${token}`
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
  }

  //fetch the office hours (type3 slots) of the selected owner
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
  }

  return (
    <div>
      <DashboardTopnav
        userEmail={user?.email || 'user@mail.mcgill.ca'}
        userName={user?.name || 'Student'}
        onLogout={onLogout}
      />

      {/* switch to other pages */}
      <div className="switch-buttons">
        <div className="inline-actions">
          {user?.role === 'owner' && onSwitchToOwnerDashboard && (
            <button type="button" onClick={onSwitchToOwnerDashboard}>
              Return to Owner Dashboard
            </button>
          )}
          {onOpenType2Vote && (
            <button type="button" onClick={onOpenType2Vote}>
              Type 2 Vote
            </button>
          )}
          {onOpenType3Public && (
            <button type="button" onClick={onOpenType3Public}>
              Type 3 Public
            </button>
          )}
        </div>
      </div>

      {message && <div className="notice success">{message}</div>}
      {error && <div className="notice error">{error}</div>}
      {localMessage && <div className="notice success">{localMessage}</div>}
      {localError && <div className="notice error">{localError}</div>}

      {/* Show all my bookings */}
      <div className="appointment">

        {/* One-time Appointments */}
        <h1>My One-time Appointments</h1>
        {loading ? (
          <p>Loading appointments...</p>
        ) : myBookings.length === 0 ? (
          <p>No appointments booked.</p>
        ) : (
          myBookings.map(appointment => (
            <div className="appointment-info" key={appointment.id}>
              <h2>{appointment.owner?.name}</h2>
              <p>{appointment.title}</p>
              <p>{formatDateTimeRange(appointment.start, appointment.end)}</p>
              <div className="appointment-buttons">
                <button onClick={() => window.location.href = `mailto:${appointment.owner?.email}`}>
                  Email
                </button>
                <button onClick={() => onCancel(appointment.id)}>Cancel</button>
              </div>
            </div>
          ))
        )}

        {/* Type1 Meeting Requests */}
        <h1> My Meeting Requests Status</h1>
        {requests.length === 0 ? (
          <p>No meeting requests.</p>
        ) : (
          requests.map(request => (
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
          ))
        )}
        {/* Type2 Group Meeting */}
        <h1>My Group Meeting</h1>
        {myGroupmeeting.length === 0 ? (
          <p>No office hours booked.</p>
        ) : (
          myGroupmeeting.map(meeting => (
            <div className="appointment-info" key={meeting.id}>
              <h2>{meeting.owner?.name}</h2>
              <p>{meeting.title}</p>
              <p>{formatDateTimeRange(meeting.start, meeting.end)}</p>
              <div className="appointment-buttons">
                <button onClick={() => window.location.href = `mailto:${meeting.owner?.email}`}>
                  Email
                </button>
              </div>
            </div>
          ))
        )}

        {/* Type3 Office Hours */}
        <h1>My Office Hours</h1>
        {myOfficehours.length === 0 ? (
          <p>No office hours booked.</p>
        ) : (
          myOfficehours.map(oh => (
            <div className="appointment-info" key={oh.id}>
              <h2>{oh.owner?.name}</h2>
              <p>{oh.title}</p>
              <p>{formatDateTimeRange(oh.start, oh.end)}</p>
              <div className="appointment-buttons">
                <button onClick={() => window.location.href = `mailto:${oh.owner?.email}`}>
                  Email
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Type1 SendMeeting Request Section*/}
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

      {/* Show all available office hours and one-time slots from all owners */}
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
              {/* Owner basic info and email function */}
              <div className="owner-header">
                <div>
                  <h2>{currentOwner.name}</h2>
                  <h3>{currentOwner.email}</h3>
                </div>
                <div className="owner-contact">
                  <button className="email-button" onClick={() =>
                    window.location.href = `mailto:${currentOwner.email}`}>
                    Send Message
                  </button>
                </div>
              </div>

              {/* One-time slots section */}
              <div>
                <h3>One-time Slots</h3>
                {oneTimeSlots.length === 0 ? (
                  <p>No one-time slots available.</p>
                ) : (
                  <div className='slots-list'>
                    {oneTimeSlots.map((slot) => (
                      <div className='slots-item' key={slot.id}>
                        <p className="slot-time">{formatDateTimeRange(slot.start, slot.end)}</p>
                        <button onClick={() => handleBookSlot(slot.id)}>Book Appointment</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Type3 Office hours section */}
              <div>
                <h3>Office Hours</h3>
                {officeHourSlots.length === 0 ? (
                  <p>No office hours available.</p>
                ) : (
                  <div className='slots-list'>
                    {officeHourSlots.map((slot) => (
                      <div className='slots-item' key={slot.id}>
                        <p className="slot-time">{formatDateTimeRange(slot.start, slot.end)}</p>
                        <button onClick={() => handleBookSlot(slot.id)}>Book Appointment</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p>Please select an owner to see available time slots.</p>
        )}
      </div>
    </div>
  )
}

export default UserDashboard;