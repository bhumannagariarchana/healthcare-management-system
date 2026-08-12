import React, { useState, useEffect } from 'react';
import patientService from '../services/patientService';
import { Users, UserPlus, Search, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    full_name: '',
    age: '',
    gender: 'Male',
    phone_number: '',
    email: '',
    password: ''
  });
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await patientService.getAll(search);
      setPatients(data);
    } catch (err) {
      setError('Failed to load patient records directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const handleOpenAddModal = () => {
    setIsEdit(false);
    setFormError('');
    setForm({
      full_name: '',
      age: '',
      gender: 'Male',
      phone_number: '',
      email: '',
      password: ''
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (patient) => {
    setIsEdit(true);
    setEditingId(patient.id);
    setFormError('');
    setForm({
      full_name: patient.full_name,
      age: patient.age.toString(),
      gender: patient.gender,
      phone_number: patient.phone_number,
      email: patient.email,
      password: '' // Only fill if resetting password
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient record? This will also remove their appointments and login credentials.')) {
      return;
    }
    try {
      await patientService.delete(id);
      fetchPatients();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete patient record.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!form.full_name || !form.email || !form.age || !form.phone_number) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const ageInt = parseInt(form.age);
    if (isNaN(ageInt) || ageInt <= 0) {
      setFormError('Age must be a positive number.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        full_name: form.full_name,
        age: ageInt,
        gender: form.gender,
        phone_number: form.phone_number,
        email: form.email
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (isEdit) {
        await patientService.update(editingId, payload);
      } else {
        await patientService.create(payload);
      }
      
      handleCloseModal();
      fetchPatients();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'An error occurred. Make sure email is unique.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Patient Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Add, search, and maintain primary patient details and medical cards.</p>
        </div>
        <button onClick={handleOpenAddModal} className="btn btn-primary">
          <UserPlus size={18} /> Register Patient
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Search Header */}
      <div className="glass" style={{ padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search patient by name, email, or phone number..."
            className="form-control"
            style={{ paddingLeft: '2.75rem', background: 'rgba(0,0,0,0.3)' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : patients.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
          <Users size={48} style={{ marginBottom: '1rem', opacity: '0.5' }} />
          <p>No patient records registered.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Full Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Phone Number</th>
                <th>Email Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>#PA0{patient.id}</td>
                  <td style={{ fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {patient.full_name[0].toUpperCase()}
                      </div>
                      {patient.full_name}
                    </div>
                  </td>
                  <td>{patient.age} Yrs</td>
                  <td>
                    <span className={`badge ${patient.gender === 'Male' ? 'badge-info' : 'badge-success'}`}>
                      {patient.gender}
                    </span>
                  </td>
                  <td>{patient.phone_number}</td>
                  <td>{patient.email}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleOpenEditModal(patient)} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(patient.id)} className="btn btn-danger btn-sm" style={{ padding: '0.4rem' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FORM MODAL (Add/Edit) */}
      {modalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1.5rem'
        }} className="fade-in">
          <div className="glass" style={{
            width: '100%', maxWidth: '500px', padding: '2.5rem',
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-glass)',
            position: 'relative'
          }}>
            <button onClick={handleCloseModal} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{isEdit ? 'Update Patient Record' : 'Register Patient Card'}</h3>

            {formError && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span style={{ fontSize: '0.9rem' }}>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="full_name">Patient's Full Name</label>
                <input
                  id="full_name"
                  type="text"
                  placeholder="e.g. Jane Doe"
                  className="form-control"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="age">Age</label>
                  <input
                    id="age"
                    type="number"
                    placeholder="30"
                    className="form-control"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    className="form-control"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone_number">Phone Number</label>
                <input
                  id="phone_number"
                  type="tel"
                  placeholder="123-456-7890"
                  className="form-control"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="jane.doe@example.com"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" htmlFor="password">Login Password {isEdit ? '(Leave blank to keep unchanged)' : '(Defaults to: Patient@123)'}</label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="form-control"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : (isEdit ? 'Save Changes' : 'Register Patient')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;
