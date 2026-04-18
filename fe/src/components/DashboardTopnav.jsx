/* Author: Yongrong Yang */
import './DashboardTopnav.css';
import mcgillLogo from '../assets/mcgill_logo.png';

// Topnac for all dashboard and booking pages, showing user info and logout button
function DashboardTopnav({ userEmail, userName, onLogout }) {
  return (
    <div className="topnav">
      <img src={mcgillLogo} alt="McGill Logo" />
      <h2>McGill SOCS Booking</h2>
      <div className="topnav-actions">
        <span>{userName} ({userEmail})</span>
        <button className="logout-button" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

export default DashboardTopnav;