import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import authService from '../services/authService';
import { HeartPulse, KeyRound, Mail, AlertCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if session expired
    const params = new URLSearchParams(location.search);
    if (params.get('expired')) {
      setMessage('Your session has expired. Please log in again.');
    }
    
    // Redirect if already logged in
    if (authService.getToken()) {
      navigate('/');
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await authService.login(username, password);
      // Successful login -> go to dashboard
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'var(--bg-base)'
    }}>
      <div className="glass fade-in" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-glass)'
      }}>
        {/* Brand Logo */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'var(--color-primary)',
            width: '54px',
            height: '54px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
          }}>
            <HeartPulse size={32} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '0.5rem' }} className="gradient-text">CarePulse</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Healthcare Management System</p>
        </div>

        {error && (
          <div className="alert alert-danger fade-in">
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        {message && (
          <div className="alert alert-success fade-in">
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.9rem' }}>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username / Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-muted)" style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                id="username"
                type="text"
                placeholder="enter username or email"
                className="form-control"
                style={{ paddingLeft: '2.75rem' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} color="var(--text-muted)" style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="form-control"
                style={{ paddingLeft: '2.75rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            fontSize: '0.85rem'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              Remember Me
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '1.5rem' }}
            disabled={loading}
          >
            {loading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : 'Log In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have a patient account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none' }}>
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
