import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import { ShieldCheck, UserPlus, Trash2, X, AlertCircle } from 'lucide-react';

const ReceptionistManagement = () => {
  const [receptionists, setReceptionists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchReceptionists = async () => {
    try {
      setLoading(true);
      const data = await authService.getReceptionists();
      setReceptionists(data);
    } catch (err) {
      setError('Failed to fetch receptionist accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptionists();
  }, []);

  const handleOpenModal = () => {
    setFormError('');
    setForm({ username: '', password: '' });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this receptionist account?')) {
      return;
    }
    try {
      await authService.deleteReceptionist(id);
      fetchReceptionists();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete receptionist account.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.username || !form.password) {
      setFormError('Please enter both username and password.');
      return;
    }

    setFormLoading(true);
    try {
      await authService.createReceptionist(form.username, form.password);
      handleCloseModal();
      fetchReceptionists();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create receptionist account. Username might be taken.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Receptionists Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Create and manage receptionist credentials to authorize clinic booking scheduling.</p>
        </div>
        <button onClick={handleOpenModal} className="btn btn-primary">
          <UserPlus size={18} /> Add Receptionist
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : receptionists.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
          <ShieldCheck size={48} style={{ marginBottom: '1rem', opacity: '0.5' }} />
          <p>No receptionist accounts registered.</p>
        </div>
      ) : (
        <div className="table-container" style={{ maxWidth: '600px' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role Granted</th>
                <th>Creation Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receptionists.map((rec) => (
                <tr key={rec.id}>
                  <td style={{ fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        RC
                      </div>
                      {rec.username}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-warning">{rec.role}</span>
                  </td>
                  <td>{rec.created_at.split('T')[0]}</td>
                  <td>
                    <button onClick={() => handleDelete(rec.id)} className="btn btn-danger btn-sm" style={{ padding: '0.4rem' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD MODAL */}
      {modalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifycontent: 'center',
          zIndex: 9999, padding: '1.5rem'
        }} className="fade-in">
          <div className="glass" style={{
            width: '100%', maxWidth: '420px', padding: '2.5rem',
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-glass)',
            position: 'relative', margin: 'auto'
          }}>
            <button onClick={handleCloseModal} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Create Receptionist Account</h3>

            {formError && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span style={{ fontSize: '0.9rem' }}>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="rec_username">Username / Email</label>
                <input
                  id="rec_username"
                  type="text"
                  placeholder="receptionist@clinic.com"
                  className="form-control"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" htmlFor="rec_password">Password</label>
                <input
                  id="rec_password"
                  type="password"
                  placeholder="••••••••"
                  className="form-control"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistManagement;
