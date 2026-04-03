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
      <Appointment />
      <OwnerInfo/>

    </div>
  )
}

export default Dashboard;