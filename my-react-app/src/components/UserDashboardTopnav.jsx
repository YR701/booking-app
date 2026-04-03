import './UserDashboardTopnav.css';
import mcgillLogo from '../assets/mcgill_logo.png';

function UserDashboardTopnav({ userEmail, onLogout }) {
  return (
    <div className="topnav">
      <img src={mcgillLogo} alt="McGill Logo" />
      <h2>McGill SOCS Booking</h2>
      <div>
        <span>{userEmail || 'user@mail.mcgill.ca'}</span>  
        <button className="logout" onClick={onLogout}>Logout</button> 
      </div>
    </div>
  );
}

export default UserDashboardTopnav;