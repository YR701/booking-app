/* Author: Yongrong Yang */

import './BookingPage.css';
import DashboardTopnav from '../components/DashboardTopnav';
import { useState, useEffect } from 'react';

function BookingPage({ onLogout, user, inviteOwnerId, onBack = null }) {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [slots, setSlots] = useState([]);
    const [owner, setOwner] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (inviteOwnerId) {
            fetchSlots();
        }
    }, [inviteOwnerId, user]);

    const fetchSlots = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('comp307-booking-token');
            const response = await fetch(`http://localhost:4000/api/owners/${inviteOwnerId}/slots`, {
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
            setError('');
        } catch (error) {
            console.error(error);
            setError('Error loading appointments. Please try again later.');
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async (slot) => {
        try {
            const token = localStorage.getItem('comp307-booking-token');
            const response = await fetch(`http://localhost:4000/api/slots/${slot.id}/book`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to book office hour');
      }

            setMessage('Office hour booked successfully');
            setError('');
            await fetchSlots();
        } catch (error) {
            console.error(error);
            setError(error.message || 'Error booking office hour. Please try again later.');
            setMessage('');
        }
    };

    return (
        <div className="booking-page">
            <DashboardTopnav
                userEmail={user?.email || 'user@mail.mcgill.ca'}
                userName={user?.name || 'User'}
                onLogout={onLogout}
            />
            <section className="slots booking-page-header">
                <div>
                    <h1>{owner?.name ? `${owner.name}'s Booking Page` : 'Booking Page'}</h1>
                    <p>
                        {owner?.email
                            ? `Showing only active slots for ${owner.email}.`
                            : 'Showing available active slots for this owner.'}
                    </p>
                </div>
                {onBack && (
                    <button type="button" onClick={onBack}>
                        Back
                    </button>
                )}
            </section>
            {message && <div className="notice success">{message}</div>}
            {error && <div className="notice error">{error}</div>}

            <div className="slots">
                <h2>Available Slots</h2>
                {loading ? (
                    <p>Loading slots...</p>
                ) : slots.length === 0 ? (
                    <p>No available slots.</p>
                ) : (
                    slots.map((slot) => (
                        <div className="slots-info" key={slot.id}>
                            <h3>{slot.owner?.name || owner?.name || 'Owner'}</h3>
                            <p>{slot.title}</p>
                            <p>
                                {new Date(slot.start).toLocaleDateString()}{' '}
                                {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                                {new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <div className="slot-actions">
                                <button type="button" onClick={() => handleBook(slot)}>
                                    Book
                                </button>
                                <button type="button" onClick={() => window.location.href = `mailto:${slot.owner?.email}`}>
                                    Email
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default BookingPage;