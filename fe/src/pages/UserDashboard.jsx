/* Author: Yongrong Yang */
import './UserDashboard.css'
import DashboardTopnav from '../components/DashboardTopnav';
//import UserCalendar from '../components/UserCalendar';
import { useState, useEffect } from 'react';

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

  if (showCalendar) {
    return <UserCalendar onBackHome={() => setShowCalendar(false)} />;
  }

  //appointments functions
  useEffect(() => {
    fetchAppointments();
    fetchOwners();
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

  //handle request a meeting, send a message to the owner
  const handleBook = (slot) => {
    try {
      const token = localStorage.getItem('comp307-booking-token');
      const response = fetch('http://localhost:4000/api/meetings/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = awaitresponse.json();
        throw new Error('Failed to request a meeting');
      }

      setMessage('Meeting request sent successfully');
      setError('');
    } catch (error) {
      console.error(error);
      setError('Error requesting a meeting. Please try again later.');
      setMessage('');
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
                  <button onClick={() => {
                    const startTime = document.getElementById('startTime').value;
                    const endTime = document.getElementById('endTime').value;
                    const reason = document.getElementById('reason').value;

                    const requestData = {
                      ownersId: currentOwner.id,
                      ownerName: currentOwner.name,
                      ownerEmail: currentOwner.email,
                      userId: user?.id,
                      userName: user?.name,
                      userEmail: user?.email,
                      startTime: startTime,
                      endTime: endTime,
                      reason: reason,
                      status: 'pending'
                    };
                    console.log(requestData);
                    alert(`Requested a meeting with ${currentOwner.name} from ${startTime} to ${endTime} for reason: ${reason}`);

                    document.getElementById('startTime').value = '';
                    document.getElementById('endTime').value = '';
                    document.getElementById('reason').value = '';
                  }}>Submit</button>
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