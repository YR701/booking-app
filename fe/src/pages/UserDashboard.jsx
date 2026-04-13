/* Author: Yongrong Yang */
import './UserDashboard.css'
import DashboardTopnav from '../components/DashboardTopnav';
//import UserCalendar from '../components/UserCalendar';
import { useState, useEffect } from 'react';
import { buildMailto } from '../utils/mailto';

function UserDashboard({ handleLogout, user }) {
  //UserCalendar back to dashboard function
  const [showCalendar, setShowCalendar] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState(null);
  const [owners, setOwners] = useState([]);
  const [slots, setSlots] = useState([]);
  const [currentOwner, setCurrentOwner] = useState(null);
  const [requests, setRequests] = useState([]);

  if (showCalendar) {
    return <UserCalendar onBackHome={() => setShowCalendar(false)} />;
  }

  //appointments functions
  useEffect(() => {
    fetchAppointments();
    fetchOwners();
    fetchRequests();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('comp307-booking-token');
      const response = await fetch('http://localhost:4000/api/me/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      setAppointments(data.bookings);
      setError('');
    } catch (error) {
      console.error(error);
      setError('Error loading appointments. Please try again later.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  //cancel appointment
  const onCancel = async (id) => {
    try {
      const token = localStorage.getItem('comp307-booking-token');
      const response = await fetch(`http://localhost:4000/api/slots/${id}/booking`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('Failed to cancel appointment');
      }
      setMessage('Appointment canceled successfully');
      setError('');
      fetchAppointments();
    } catch (error) {
      console.error(error);
      setError('Error canceling appointment. Please try again later.');
      setMessage('');
    }
  };


  //owner info functions

  //get all the available owners for the dropdown list
  const fetchOwners = async () => {
    try {
      const token = localStorage.getItem('comp307-booking-token');
      const response = await fetch('http://localhost:4000/api/owners', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch owners');
      }
      const data = await response.json();
      setOwners(data.owners);
      setError('');
    } catch (error) {
      console.error(error);
      setError('Error loading owners. Please try again later.');
      setMessage('');
      setOwners([]);
    }
  };

  //fetch the available slots of the selected owner
  const fetchSlots = async (ownerId) => {
    try {
      const token = localStorage.getItem('comp307-booking-token');
      const response = await fetch(`http://localhost:4000/api/owners/${ownerId}/slots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch slots');
      }
      const data = await response.json();
      setCurrentOwner(data.owner);
      setSlots(data.slots);
      setError('');
    } catch (error) {
      console.error(error);
      setError('Error loading slots. Please try again later.');
      setSlots([]);
    }
  }

  //select different owner to see their available slots
  const handleOwnerChange = async (event) => {
    const value = event.target.value;

    if (value === '') {
      setSelectedOwnerId(null);
      setCurrentOwner(null);
      setSlots([]);
    } else {
      setSelectedOwnerId(value);
      await fetchSlots(value);
    }
  }
  
  //request a meeting functions

  //handle request a meeting, send a message to the owner
  const handleRequest = async() => {
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const reason = document.getElementById('reason').value;

    //verify the input info
    if (!startTime || !endTime || !reason) {
      alert('Please fill in all fields to request a meeting.');
      return;
    }
    if (startTime >= endTime) {
      alert('Start time must be before end time.');
      return;
    }

    try {
      const token = localStorage.getItem('comp307-booking-token');
      const response =  await fetch('http://localhost:4000/api/meetings/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ownerId: currentOwner.id,
          title: 'Meeting Request',
          startTime: startTime,
          endTime: endTime,
          reason: reason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('Failed to request a meeting');
      }

      setMessage('Meeting request sent successfully');
      setError('');

      //clear the form
      document.getElementById('startTime').value = '';
      document.getElementById('endTime').value = '';
      document.getElementById('reason').value = '';

      //update the request list
      await fetchRequests();

      //send email notification to the owner
      const subject = 'New Meeting Request';
      const body = `You have a new meeting request from ${user.name} (${user.email}).\n\nReason: ${reason}\n\nRequested Time: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}`;
      const mailtoLink = buildMailto(currentOwner.email, subject, body);
      window.location.href = mailtoLink;

    } catch (error) {
      console.error(error);
      setError(error.message);
      setMessage('');
    }
  }

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('comp307-booking-token');
      const response = await fetch('http://localhost:4000/api/meetings/requests', {
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
      setError('');
    } catch (error) {
      console.error(error);
      setError('Error loading requests. Please try again later.');
      setRequests([]);
    }
  }

  return (
    <div>
      <DashboardTopnav
        userEmail={user?.email || 'user@mail.mcgill.ca'}
        userName={user?.name || 'Student'}
        onLogout={handleLogout}
      />
      {message && <div className="notice success">{message}</div>}
      {error && <div className="notice error">{error}</div>}
      <div className="appointment">
        <h1>My Appointments</h1>
        {appointments.length === 0 ? (
          <p>No appointments booked.</p>
        ) : (
          appointments.map(appointment => (
            <div className="appointment-info" key={appointment.id}>
              <h2>{appointment.owner?.name}</h2>
              <p>{appointment.title}</p>
              <p>
                {new Date(appointment.start).toLocaleDateString()}
                {new Date(appointment.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                {new Date(appointment.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <div className="appointment-buttons">
                <button onClick={() => window.location.href = `mailto:${appointment.owner?.email}`}>
                  Email
                </button>
                <button onClick={() => onCancel(appointment.id)}> Cancel</button>
              </div>
            </div>
          ))
        )}
        <h1> My Meeting Requests Status</h1>
        {requests.length === 0 ? (
          <p>No meeting requests.</p>
        ) : (
          requests.map(request => (
            <div className="appointment-info" key={request.id}>
              <h2>{request.owner?.name}</h2>
              <p>{request.title}</p>
              <p>
                {new Date(request.start).toLocaleDateString()}
                {new Date(request.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                {new Date(request.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
              <p>{request.status}</p>
            </div>
          ))
        )}
      </div>

      <div className="OwnerInfo">
        <h1>All available slots</h1>
        <div className='owner-list'>
          <select name="owners" id="owners" onChange={handleOwnerChange} value={selectedOwnerId || ''}>
            <option value="">-- Select an owner --</option>
            {owners.map(owner => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
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
                  <button className="email-button" onClick={() => window.location.href = `mailto:${currentOwner.email}`}>Send Message</button>
                </div>
              </div>

              <div className='slots-list'>
                {slots.map((slot) => (
                  <div className='slots-item' key={slot.id}>
                    <p className="slot-time">
                      {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                      {new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <button onClick={() => handleBook(slot)}>Book Office Hour</button>
                  </div>
                ))}
              </div>

              <div className="request-meeting">
                <h3>Request a Meeting with {currentOwner.name}</h3>
                <div className='request-form'>
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
          </div>
        ) : (
          <p>Please select an owner to see available time slots.</p>
        )}
      </div>
    </div>
  )
}

export default UserDashboard;