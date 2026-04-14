/* Author: Yongrong Yang */
import './BookingPages.css';
import DashboardTopnav from '../components/DashboardTopnav';
import { useState, useEffect, use } from 'react';


function BookingPage({ onLogout, user, inviteOwnerId}) {

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [slots, setSlots] = useState([]);
    const [owner, setOwner] = useState({});
    const [loading, setLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);

    useEffect(() => {
        if (inviteOwnerId)
        fetchSlots();
    } , [ownerID]);

    const fetchSlots = async () => {
        try {
            const token = localStorage.getItem('comp307-booking-token');
            const response = await fetch('http://localhost:4000/api/users/${inviteOwnerId}/slots', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch appointments');
            }
            const data = await response.json();
            setOwner(data.owner);
            setSlots(data.slots);
            setShowLogin(false);
        } catch (error) {
            console.error(error);
            setError('Error loading appointments. Please try again later.');
            setSlots([]);
        }
    };

    return (
        <div>
            <DashboardTopnav
                userEmail={user?.email || 'user@mail.mcgill.ca'}
                userName={user?.name || 'User'}
                onLogout={onLogout}
            />
            {message && <div className="notice success">{message}</div>}
            {error && <div className="notice error">{error}</div>}

            <div className="slots">
                <h1>Available Slots</h1>
                {slots.length === 0 ? (
                    <p>No available slots.</p>
                ) : (
                    slots.map(slots => (
                        <div className="slots-info" key={slots.id}>
                            <h2>{slots.owner?.name}</h2>
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
        </div>
    )
}

export default BookingPage;