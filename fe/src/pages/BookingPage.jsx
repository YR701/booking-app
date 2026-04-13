/* Author: Yongrong Yang */
import DashboardTopnav from '../components/DashboardTopnav';
import { useState, useEffect } from 'react';

function BookingPage({ onLogout, user }) {

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    return (
        <div>
            <DashboardTopnav
                userEmail={user?.email || 'owner@mcgill.ca'}
                userName={user?.name || 'Owner'}
                onLogout={onLogout}
            />
            {message && <div className="notice success">{message}</div>}
            {error && <div className="notice error">{error}</div>}

            
        </div>
    )
}

export default BookingPage;