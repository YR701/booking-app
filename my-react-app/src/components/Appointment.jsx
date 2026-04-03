import './Appointment.css';

function Appointment(appointment, onEmail, onCancel) {
    return (
        <div className="appointment-info">
            <h2>{appointment.ownerName}</h2>
            <p>xxxx/xx/xx 9:00 AM - 10:00 AM</p>
            <div className="appointment-buttons">
                <button onClick={() => onEmail(appointment.ownerEmail)}>Email</button>
                <button onClick={() => onCancel(appointment.id)}> Cancel</button>
            </div>
        </div>
    );
}

export default Appointment;