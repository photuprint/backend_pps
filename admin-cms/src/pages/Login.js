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
      console.log('Attempting login with:', { email, password });
      const res = await api.post('/auth/login', { email, password });
      console.log('Login response:', res.data);
      
      if (res.data.user.role !== 'admin') {
        setError('Access denied. Only admins can log in.');
        return;
      }
      
      login(res.data);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.msg || 'Login failed. Please check your credentials.');
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
