import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import { HeartPulse, KeyRound, Mail, User, Phone, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    age: '',
    gender: 'Male',
    phone_number: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Keep username matched with email automatically
      if (name === 'email') {
        updated.username = value;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!formData.email || !formData.password || !formData.full_name || !formData.age || !formData.phone_number) {
      setError('Please fill in all required fields.');
      return;
    }

    if (parseInt(formData.age) <= 0 || isNaN(parseInt(formData.age))) {
      setError('Please enter a valid age.');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        ...formData,
        age: parseInt(formData.age)
      });
      // Redirect to login page
      navigate('/login?registered=true');
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Registration failed. Please make sure the email is unique.'
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
        maxWidth: '500px',
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-glass)'
      }}>
        {/* Header */}
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
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '0.5rem' }} className="gradient-text">Patient Registration</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Create an account to manage appointments and prescriptions</p>
        </div>

        {error && (
          <div className="alert alert-danger fade-in">
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="full_name">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="var(--text-muted)" style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="John Doe"
                className="form-control"
                style={{ paddingLeft: '2.75rem' }}
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-muted)" style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="johndoe@example.com"
                className="form-control"
                style={{ paddingLeft: '2.75rem' }}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Password */}
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
                name="password"
                type="password"
                placeholder="••••••••"
                className="form-control"
                style={{ paddingLeft: '2.75rem' }}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Grid for Age & Gender */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="age">Age</label>
              <div style={{ position: 'relative' }}>
                <CalendarIcon size={18} color="var(--text-muted)" style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }} />
                <input
                  id="age"
                  name="age"
                  type="number"
                  placeholder="25"
                  className="form-control"
                  style={{ paddingLeft: '2.75rem' }}
                  value={formData.age}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                className="form-control"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Phone Number */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="phone_number">Phone Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} color="var(--text-muted)" style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                placeholder="123-456-7890"
                className="form-control"
                style={{ paddingLeft: '2.75rem' }}
                value={formData.phone_number}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '1.5rem' }}
            disabled={loading}
          >
            {loading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : 'Register Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none' }}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
