/* Author: Yongrong Yang */

import { API_BASE, TOKEN_KEY } from '../config';
import './BookingPage.css';
import DashboardTopnav from '../components/DashboardTopnav';
import { useState, useEffect } from 'react';
import { openQuestionMail } from '../utils/mailtoSlots';
import { formatDateTimeRange } from '../utils/formatTime';
import { fetchOfficeHourSlots, handleBookOfficeHour } from '../utils/OfficeHour';

function BookingPage({ onLogout, user, inviteOwnerId, onBookSlot, onBack = null }) {
    const [localMessage, setLocalMessage] = useState('');
    const [localError, setLocalError] = useState('');
    const [slots, setSlots] = useState([]);
    const [owner, setOwner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [officeHourSlots, setOfficeHourSlots] = useState([]);

    useEffect(() => {
        if (inviteOwnerId) {
            fetchSlots();
            loadOfficeHourSlots(inviteOwnerId);
        }
    }, [inviteOwnerId, user]);

    const fetchSlots = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            const response = await fetch(`${API_BASE}/owners/${inviteOwnerId}/slots`, {
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
            setLocalError('');
        } catch (error) {
            console.error(error);
            setLocalError('Error loading appointments. Please try again later.');
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const bookOfficeHour = async (slotId) => {
        const result = await handleBookOfficeHour(slotId);
        if (result.success) {
            setLocalMessage(result.message);
            setLocalError('');
            await loadOfficeHourSlots(inviteOwnerId);
        } else {
            setLocalError(result.message);
            setLocalMessage('');
        }
    };


    //load owner's office hour slots
    const loadOfficeHourSlots = async (ownerId) => {
        const { slots, owner, error } = await fetchOfficeHourSlots(ownerId);

        if (error) {
            setLocalError(error);
        } else {
            setOfficeHourSlots(slots);
            setLocalError('');
            if (owner) {
                setOwner(owner);
            }
        }
    }

    return (
        <div>
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
                            ? `Browse active slots for ${owner.name || 'this owner'} (${owner.email}).`
                            : 'Browse active one-time slots and office-hour slots for this owner.'}
                    </p>
                </div>
                {onBack && (
                    <button type="button" onClick={onBack}>
                        Back
                    </button>
                )}
            </section>
            {localMessage && <div className="notice success">{localMessage}</div>}
            {localError && <div className="notice error">{localError}</div>}

            {/* One-time slots */}
            <div className="slots">
                <h2>Available One-Time Slots ({slots.length})</h2>
                {loading ? (
                    <p>Loading slots...</p>
                ) : slots.length === 0 ? (
                    <p>No available one-time slots.</p>
                ) : (
                    <div className="slots-list-scroll">
                        {slots.map((slot) => (
                            <div className="slots-info" key={slot.id}>
                                <h3>{slot.owner?.name || owner?.name || 'Owner'}</h3>
                                <p>{slot.title}</p>
                                <p>{formatDateTimeRange(slot.start, slot.end)}</p>
                                <div className="slot-actions">
                                    <button type="button" onClick={() => onBookSlot(slot.id)}>
                                        Book
                                    </button>
                                    <button type="button" onClick={() => {
                                        openQuestionMail({
                                            email: slot.owner?.email || owner?.email,
                                            ownerName: slot.owner?.name || owner?.name || 'Professor',
                                            topic: slot.title || 'booking slot',
                                            whenText: formatDateTimeRange(slot.start, slot.end),
                                            senderName: user?.name || 'Student',
                                            onMissingEmail: () => {
                                                setLocalError('No email address available for this owner.');
                                            },
                                        });
                                    }}>
                                        Email
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Office hour slots */}
            <div className="slots">
                <h2>Available Office Hour Slots ({officeHourSlots.length})</h2>
                {loading ? (
                    <p>Loading slots...</p>
                ) : officeHourSlots.length === 0 ? (
                    <p>No available office hour slots.</p>
                ) : (
                    <div className="slots-list-scroll">
                        {officeHourSlots.map((slot) => (
                            <div className="slots-info" key={slot.id}>
                                <h3>{slot.owner?.name || owner?.name || 'Owner'}</h3>
                                <p>{slot.title}</p>
                                <p>{formatDateTimeRange(slot.start, slot.end)}</p>
                                <div className="slot-actions">
                                    <button type="button" onClick={() => bookOfficeHour(slot.id)}>
                                        Book
                                    </button>
                                    <button type="button" onClick={() => {
                                        openQuestionMail({
                                            email: slot.owner?.email || owner?.email,
                                            ownerName: slot.owner?.name || owner?.name || 'Professor',
                                            topic: slot.title || 'booking slot',
                                            whenText: formatDateTimeRange(slot.start, slot.end),
                                            senderName: user?.name || 'Student',
                                            onMissingEmail: () => {
                                                setLocalError('No email address available for this owner.');
                                            },
                                        });
                                    }}>
                                        Email
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default BookingPage;