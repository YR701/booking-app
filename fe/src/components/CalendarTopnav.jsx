/* Author: Yongrong Yang */
import './DashboardTopnav.css';
import mcgillLogo from '../assets/mcgill_logo.png';

function UserCalendarTopnav({ userEmail, onLogout, onBackHome }) {
  return (
    <div className="topnav">
      <img src={mcgillLogo} alt="McGill Logo" />
      <h2>McGill SOCS Booking</h2>
      <div className="topnav-actions">
        <span>{userEmail || 'user@mail.mcgill.ca'}</span>
        <button className="home-button" onClick={onBackHome}>Back to DashBoard</button>
        <button className="logout-button" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

export default UserCalendarTopnav;