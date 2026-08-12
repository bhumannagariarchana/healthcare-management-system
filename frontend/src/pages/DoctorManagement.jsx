import React, { useState, useEffect } from 'react';
import doctorService from '../services/doctorService';
import { Stethoscope, UserPlus, Search, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    full_name: '',
    department: 'General Medicine',
    experience: '',
    email: '',
    password: '',
    available_slots: '09:00, 10:00, 11:00, 14:00, 15:00' // default comma-separated
  });
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getAll(search);
      setDoctors(data);
    } catch (err) {
      setError('Failed to load doctors catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [search]);

  const handleOpenAddModal = () => {
    setIsEdit(false);
    setFormError('');
    setForm({
      full_name: '',
      department: 'General Medicine',
      experience: '',
      email: '',
      password: '',
      available_slots: '09:00, 10:00, 11:00, 14:00, 15:00'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (doctor) => {
    setIsEdit(true);
    setEditingId(doctor.id);
    setFormError('');
    setForm({
      full_name: doctor.full_name,
      department: doctor.department,
      experience: doctor.experience.toString(),
      email: doctor.email,
      password: '', // Leave blank for security, update only if filled
      available_slots: doctor.available_slots.join(', ')
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this doctor? This will also delete their login account.')) {
      return;
    }
    try {
      await doctorService.delete(id);
      fetchDoctors();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete doctor.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!form.full_name || !form.email || !form.experience || (!isEdit && !form.password)) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const expInt = parseInt(form.experience);
    if (isNaN(expInt) || expInt < 0) {
      setFormError('Experience must be a positive number.');
      return;
    }

    // Split available slots by comma and clean whitespace
    const slotsArray = form.available_slots
      .split(',')
      .map(s => s.trim())
      .filter(s => s !== '');

    if (slotsArray.length === 0) {
      setFormError('Please define at least one available time slot.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        full_name: form.full_name,
        department: form.department,
        experience: expInt,
        email: form.email,
        available_slots: slotsArray
      };

      if (isEdit) {
        if (form.password) {
          payload.password = form.password;
        }
        await doctorService.update(editingId, payload);
      } else {
        payload.password = form.password;
        await doctorService.create(payload);
      }
      
      handleCloseModal();
      fetchDoctors();
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
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Doctors Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Configure medical departments, doctor accounts, and consultation hours.</p>
        </div>
        <button onClick={handleOpenAddModal} className="btn btn-primary">
          <UserPlus size={18} /> Add Doctor
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Search Header */}
      <div className="glass" style={{ padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search doctor by name or department..."
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
      ) : doctors.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
          <Stethoscope size={48} style={{ marginBottom: '1rem', opacity: '0.5' }} />
          <p>No doctors found matching the query.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Department</th>
                <th>Experience</th>
                <th>Email Address</th>
                <th>Work Shifts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td style={{ fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        DR
                      </div>
                      {doctor.full_name}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">{doctor.department}</span>
                  </td>
                  <td>{doctor.experience} Years</td>
                  <td>{doctor.email}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '300px' }}>
                      {doctor.available_slots.map(s => (
                        <span key={s} className="badge" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', fontSize: '0.7rem' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleOpenEditModal(doctor)} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(doctor.id)} className="btn btn-danger btn-sm" style={{ padding: '0.4rem' }}>
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
            width: '100%', maxWidth: '550px', padding: '2.5rem',
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-glass)',
            position: 'relative'
          }}>
            <button onClick={handleCloseModal} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{isEdit ? 'Modify Doctor Account' : 'Register Doctor Account'}</h3>

            {formError && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span style={{ fontSize: '0.9rem' }}>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="full_name">Doctor's Full Name</label>
                <input
                  id="full_name"
                  type="text"
                  placeholder="e.g. Dr. John Doe"
                  className="form-control"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="department">Department</label>
                  <select
                    id="department"
                    className="form-control"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Dermatology">Dermatology</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="experience">Experience (Years)</label>
                  <input
                    id="experience"
                    type="number"
                    placeholder="10"
                    className="form-control"
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="doctor@clinic.com"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Login Password {isEdit && '(Leave blank to keep unchanged)'}</label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="form-control"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!isEdit}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" htmlFor="available_slots">Available Shifts Time Slots (comma-separated)</label>
                <input
                  id="available_slots"
                  type="text"
                  placeholder="09:00, 10:00, 11:00, 14:00, 15:00"
                  className="form-control"
                  value={form.available_slots}
                  onChange={(e) => setForm({ ...form, available_slots: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>Provide 24h formatted times, e.g. 09:00, 14:30. Separated by commas.</span>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : (isEdit ? 'Save Changes' : 'Add Doctor')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorManagement;
