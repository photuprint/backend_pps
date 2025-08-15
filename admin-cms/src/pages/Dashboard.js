import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();

  const containerStyle = {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  };

  const titleStyle = {
    color: '#333',
    margin: 0
  };

  const logoutButtonStyle = {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  };

  const cardStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    border: '1px solid #e9ecef'
  };

  const linkStyle = {
    display: 'block',
    padding: '15px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    textAlign: 'center',
    marginBottom: '10px',
    transition: 'background-color 0.3s'
  };

  const linkHoverStyle = {
    backgroundColor: '#0056b3'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>
          Welcome, {user?.user?.name || 'Admin'}! 👋
        </h1>
        <button onClick={logout} style={logoutButtonStyle}>
          Logout
        </button>
      </div>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <h3>📦 Product Management</h3>
          <p>Manage your products, categories, and inventory</p>
          <Link to="/products" style={linkStyle}>
            Manage Products
          </Link>
        </div>

        <div style={cardStyle}>
          <h3>🎫 Coupon Management</h3>
          <p>Create and manage discount coupons</p>
          <Link to="/coupons" style={linkStyle}>
            Manage Coupons
          </Link>
        </div>

        <div style={cardStyle}>
          <h3>📋 Order Management</h3>
          <p>View and manage customer orders</p>
          <Link to="/orders" style={linkStyle}>
            Manage Orders
          </Link>
        </div>

        <div style={cardStyle}>
          <h3>👥 User Management</h3>
          <p>Manage user accounts and permissions</p>
          <Link to="/users" style={linkStyle}>
            Manage Users
          </Link>
        </div>

        <div style={cardStyle}>
          <h3>📊 Analytics</h3>
          <p>View sales reports and analytics</p>
          <Link to="/analytics" style={linkStyle}>
            View Analytics
          </Link>
        </div>

        <div style={cardStyle}>
          <h3>⚙️ Settings</h3>
          <p>Configure system settings</p>
          <Link to="/settings" style={linkStyle}>
            System Settings
          </Link>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
        <h3>🔧 Quick Actions</h3>
        <p>Current user: <strong>{user?.user?.email}</strong></p>
        <p>Role: <strong>{user?.user?.role}</strong></p>
      </div>
    </div>
  );
}
