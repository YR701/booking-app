import './Appointment.css';
import { useState } from 'react';

function Appointment() {
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

    //email owner
    function onEmail(email) {
        console.log(`Emailing owner at: ${email}`);
        window.location.href = `mailto:${email}`;
    }

    return (
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
                            <button onClick={() => onEmail(appointment.ownerEmail)}>Email</button>
                            <button onClick={() => onCancel(appointment.id)}> Cancel</button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default Appointment;