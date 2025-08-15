import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Status() {
  const [status, setStatus] = useState({
    backend: 'checking',
    database: 'checking',
    api: 'checking'
  });

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    // Check backend connectivity
    try {
      const response = await fetch('http://localhost:8080');
      setStatus(prev => ({ ...prev, backend: response.ok ? 'online' : 'error' }));
    } catch (error) {
      setStatus(prev => ({ ...prev, backend: 'offline' }));
    }

    // Check API connectivity
    try {
      const response = await api.get('/users');
      setStatus(prev => ({ ...prev, api: 'online' }));
    } catch (error) {
      setStatus(prev => ({ ...prev, api: 'offline' }));
    }

    // Check database through API
    try {
      const response = await api.get('/users');
      setStatus(prev => ({ ...prev, database: 'online' }));
    } catch (error) {
      setStatus(prev => ({ ...prev, database: 'offline' }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#28a745';
      case 'offline': return '#dc3545';
      case 'error': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return '✅ Online';
      case 'offline': return '❌ Offline';
      case 'error': return '⚠️ Error';
      default: return '⏳ Checking...';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>System Status</h1>
      
      <div style={{ display: 'grid', gap: '20px', maxWidth: '600px' }}>
        <div style={{ 
          padding: '20px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          backgroundColor: 'white'
        }}>
          <h3>Backend Server</h3>
          <p style={{ color: getStatusColor(status.backend) }}>
            {getStatusText(status.backend)}
          </p>
          <p>URL: http://localhost:8080</p>
        </div>

        <div style={{ 
          padding: '20px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          backgroundColor: 'white'
        }}>
          <h3>API Endpoints</h3>
          <p style={{ color: getStatusColor(status.api) }}>
            {getStatusText(status.api)}
          </p>
          <p>Base URL: {api.defaults.baseURL}</p>
        </div>

        <div style={{ 
          padding: '20px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          backgroundColor: 'white'
        }}>
          <h3>Database</h3>
          <p style={{ color: getStatusColor(status.database) }}>
            {getStatusText(status.database)}
          </p>
          <p>MongoDB Atlas</p>
        </div>
      </div>

      <button 
        onClick={checkSystemStatus}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Refresh Status
      </button>
    </div>
  );
} 