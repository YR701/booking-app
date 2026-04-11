// Author: Jenny Hua
import './OwnerDashboard.css'
import OwnerDashboardTopnav from '../components/DashboardTopnav';
import mcgillLogo from '../assets/mcgill_logo.png';
import { useState } from 'react';

function OwnerDashboard({ handleLogout, user }) {
    return (
        <div>
            {/* Use the same topnav as user dashboard might looks better */}
            <OwnerDashboardTopnav
                userEmail={user?.email || 'user@mcgill.ca'}
                userName={user?.name || 'Stuff'}
                onLogout={handleLogout}
            />
            {/* Owner dashboard content goes here */}
        </div>
    );
}

export default OwnerDashboard;