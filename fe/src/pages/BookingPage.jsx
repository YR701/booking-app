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
    const [loading, setLoading] = useState(true);

    const [slots, setSlots] = useState([]);
    const [officeHourSlots, setOfficeHourSlots] = useState([]);
    const [owner, setOwner] = useState(null);


    useEffect(() => {
        if (inviteOwnerId) {
            fetchSlots();
            loadOfficeHourSlots(inviteOwnerId);
        }
    }, [inviteOwnerId, user]);

    //Time limitation for past slots
    const filterFutureSlots = (slotsList) => {
        const now = new Date();
        return (slotsList || []).filter((slot) => {
            const startDate = new Date(slot.start);
            return !Number.isNaN(startDate.getTime()) && startDate >= now;
        });
    };

    const visibleOneTimeSlots = filterFutureSlots(slots);
    const visibleOfficeHourSlots = filterFutureSlots(officeHourSlots);

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

    return (
        <div>
            <DashboardTopnav
                userEmail={user?.email || 'user@mail.mcgill.ca'}
                userName={user?.name || 'User'}
                onLogout={onLogout}
            />
            {/* provide back button for owner preview */}
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
                <h2>Available One-Time Slots ({visibleOneTimeSlots.length})</h2>
                {loading ? (
                    <p>Loading slots...</p>
                ) : visibleOneTimeSlots.length === 0 ? (
                    <p>No available one-time slots.</p>
                ) : (
                    <div className="slots-list-scroll">
                        {visibleOneTimeSlots.map((slot) => (
                            <div className="slots-info" key={slot.id}>
                                <h3>{slot.owner?.name || owner?.name || 'Owner'}</h3>
                                <p>{slot.title}</p>
                                <p>{formatDateTimeRange(slot.start, slot.end)}</p>
                                <div className="slot-actions">
                                    <button type="button" className="btn-primary" onClick={() => onBookSlot(slot.id)}>
                                        Book
                                    </button>
                                    <button type="button" className="btn-secondary" onClick={() => {
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
                <h2>Available Office Hour Slots ({visibleOfficeHourSlots.length})</h2>
                {loading ? (
                    <p>Loading slots...</p>
                ) : visibleOfficeHourSlots.length === 0 ? (
                    <p>No available office hour slots.</p>
                ) : (
                    <div className="slots-list-scroll">
                        {visibleOfficeHourSlots.map((slot) => (
                            <div className="slots-info" key={slot.id}>
                                <h3>{slot.owner?.name || owner?.name || 'Owner'}</h3>
                                <p>{slot.title}</p>
                                <p>{formatDateTimeRange(slot.start, slot.end)}</p>
                                <div className="slot-actions">
                                    <button type="button" className="btn-primary" onClick={() => bookOfficeHour(slot.id)}>
                                        Book
                                    </button>
                                    <button type="button" className="btn-secondary" onClick={() => {
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