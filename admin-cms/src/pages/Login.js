import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.user.role !== 'admin') {
        setError('Access denied. Only admins can log in.');
        setLoading(false);
        return;
      }
      
      login(res.data);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      
      // More detailed error handling
      if (err.code === 'ECONNREFUSED' || err.message === 'Network Error') {
        setError('Cannot connect to server. Please ensure the backend server is running on port 8080.');
      } else if (err.response) {
        // Server responded with error
        setError(err.response.data?.msg || `Login failed: ${err.response.status} ${err.response.statusText}`);
      } else if (err.request) {
        // Request made but no response
        setError('No response from server. Please check if the backend is running.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="containerStyle">
      <div className="formStyle">
        <div className="logoStyle marginAuto appendBottom20 textLogo">PhotuPrint</div>
        <h2 className="textCenter font24 fontMedium appendBottom10 blackText ">
          Admin Login
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="inputStyle"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="inputStyle"
            required
          />
          <button 
            type="submit" 
            className="buttonStyle"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {error && <p className="errorStyle">{error}</p>}
        </form>
      </div>
    </div>
  );
}
