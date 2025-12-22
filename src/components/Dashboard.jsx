import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="nav-content">
          <h2>Dashboard</h2>
          <div className="nav-right">
            <span className="user-info">Welcome, {user?.name || user?.email}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      <div className="dashboard-content">
        <div className="welcome-card">
          <h1>Welcome to your Dashboard!</h1>
          <p>You have successfully logged in.</p>
          <div className="user-details">
            <h3>User Information</h3>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>User ID:</strong> {user?.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;




