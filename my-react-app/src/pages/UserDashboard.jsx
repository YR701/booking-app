import './UserDashboard.css'
import UserDashboardTopnav from '../components/UserDashboardTopnav';
import Appointment from '../components/Appointment';
import OwnerInfo from '../components/OwnerInfo';

function Dashboard() {
  const handleLogout = () => {
    console.log('Logout clicked')
  }

  return (
    <div>
      <UserDashboardTopnav 
        userEmail="student@mail.mcgill.ca" 
        onLogout={handleLogout} 
      />
      <div className='appointment'>
        <h2>My Appointments</h2>
        <Appointment />
      </div>

      <div className="OwnerInfo">
        <h2>Make a New Appointment</h2>
        <OwnerInfo ownerName="Prof. Smith" ownerEmail="smith@mcgill.ca" />
      </div>

    </div>
  )
}

export default Dashboard;