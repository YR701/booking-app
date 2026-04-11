/* Author: Yongrong Yang */
import './UserDashboard.css'
import UserDashboardTopnav from '../components/UserDashboardTopnav';
//import UserCalendar from '../components/UserCalendar';
import { useState } from 'react';

function Dashboard({handleLogout, user}) {
  //UserCalendar back to dashboard function
  const [showCalendar, setShowCalendar] = useState(false);

  if (showCalendar) {
    return <UserCalendar onBackHome={() => setShowCalendar(false)} />;
  }

  //appointments functions
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      ownerName: "Prof. Smith",
      ownerEmail: "smith@mcgill.ca",
      date: "2024-04-15",
      startTime: "9:00 AM",
      endTime: "10:00 AM"
    },
    {
      id: 2,
      ownerName: "Prof. Johnson",
      ownerEmail: "johnson@mcgill.ca",
      date: "2024-04-16",
      startTime: "2:00 PM",
      endTime: "3:00 PM"
    },
    {
      id: 3,
      ownerName: "Prof. Williams",
      ownerEmail: "williams@mcgill.ca",
      date: "2024-04-18",
      startTime: "11:00 AM",
      endTime: "12:00 PM"
    }
  ]);

  //cancel appointment
  function onCancel(id) {
    console.log(`Canceled appointment with id: ${id}`);
    setAppointments(appointments.filter(appointment => appointment.id !== id));
  };


  //owner info functions
  //maybe we need to fliter owners who have available time slots? but for now we just show all the owners.
  const ownersData = {
    1: {
      id: 1,
      name: "Prof. Smith",
      email: "smith@mcgill.ca",
      timeSlots: [
        "2024-04-15 9:00 AM - 10:00 AM",
        "2024-04-15 10:00 AM - 11:00 AM",
        "2024-04-15 11:00 AM - 12:00 PM",
      ]
    },
    2: {
      id: 2,
      name: "Prof. Johnson",
      email: "johnson@mcgill.ca",
      timeSlots: [
        "2024-04-16 1:00 PM - 2:00 PM",
        "2024-04-16 2:00 PM - 3:00 PM",
        "2024-04-17 9:00 AM - 10:00 AM",
      ]
    },
    3: {
      id: 3,
      name: "Prof. Williams",
      email: "williams@mcgill.ca",
      timeSlots: [
        "2024-04-18 10:00 AM - 11:00 AM",
        "2024-04-18 11:00 AM - 12:00 PM",
        "2024-04-19 2:00 PM - 3:00 PM",
      ]
    },
  }

  const [selectedOwnerId, setSelectedOwnerId] = useState(null);

  //get the current selected owner
  let currentOwner = null;
  if (selectedOwnerId !== null) {
    currentOwner = ownersData[selectedOwnerId];
  }

  function handleOwnerChange(event) {
    const value = event.target.value;

    if (value === '') {
      setSelectedOwnerId(null);
    } else {
      setSelectedOwnerId(parseInt(value));
    }
  }

  function handleBook(slot) {
    console.log('Booking:', slot, 'with', currentOwner.name)
    alert(`Booked ${slot} with ${currentOwner.name}`);
  }

  return (
    <div>
      <UserDashboardTopnav
        userEmail={user?.email || 'user@mail.mcgill.ca'}
        userName={user?.name || 'Student'}
        onLogout={handleLogout}
      />
      <div className="appointment">
        <h1>My Appointments</h1>
        {appointments.length === 0 ? (
          <p>No appointments booked.</p>
        ) : (
          appointments.map(appointment => (
            <div className="appointment-info" key={appointment.id}>
              <h2>{appointment.ownerName}</h2>
              <p>{appointment.date} {appointment.startTime} - {appointment.endTime}</p>
              <div className="appointment-buttons">
                <a href={`mailto:${appointment.ownerEmail}`}>Email</a>
                <button onClick={() => onCancel(appointment.id)}> Cancel</button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="OwnerInfo">
        <h1>Make a New Appointment</h1>
        <div className='owner-list'>
          <select name="owners" id="owners" onChange={handleOwnerChange} value={selectedOwnerId === null ? '' : selectedOwnerId}>
            <option value="">-- Select an owner --</option>
            {Object.values(ownersData).map(owner => (
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
                <div className="owner-email">
                  <button onClick={() => window.location.href = `mailto:${currentOwner.email}`}>SendMessage</button>
                </div>
              </div>

              <div className='slots-list'>
                {currentOwner.timeSlots.map((slot, index) => (
                  <div className='slots-item' key={index}>
                    <p className="slot-time">{slot}</p>
                    <button onClick={() => handleBook(slot)}>Book Office Hour</button>
                  </div>
                ))}

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

export default Dashboard;