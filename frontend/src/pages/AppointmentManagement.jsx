import React, { useState, useEffect } from 'react';
import appointmentService from '../services/appointmentService';
import doctorService from '../services/doctorService';
import patientService from '../services/patientService';
import { Calendar, Plus, Clock, Search, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [form, setForm] = useState({
    patient_id: '',
    doctor_id: '',
    date: '',
    time: '',
    status: 'Booked'
  });
  
  const [selectedDoctorSlots, setSelectedDoctorSlots] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [apptData, docData, patData] = await Promise.all([
        appointmentService.getAll({ 
          search, 
          doctor_id: doctorFilter, 
          status_filter: statusFilter 
        }),
        doctorService.getAll(),
        patientService.getAll()
      ]);
      
      setAppointments(apptData);
      setDoctors(docData);
      setPatients(patData);
    } catch (err) {
      setError('Failed to load appointments or clinic records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, doctorFilter, statusFilter]);

  // Update available slots list when doctor changes in form
  useEffect(() => {
    if (form.doctor_id) {
      const doc = doctors.find(d => d.id === parseInt(form.doctor_id));
      if (doc) {
        setSelectedDoctorSlots(doc.available_slots);
        // Reset time if it's not valid for the new doctor
        if (!doc.available_slots.includes(form.time)) {
          setForm(prev => ({ ...prev, time: doc.available_slots[0] || '' }));
        }
      }
    } else {
      setSelectedDoctorSlots([]);
    }
  }, [form.doctor_id, doctors]);

  const handleOpenAddModal = () => {
    setIsEdit(false);
    setFormError('');
    setForm({
      patient_id: patients[0]?.id?.toString() || '',
      doctor_id: doctors[0]?.id?.toString() || '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      status: 'Booked'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (appt) => {
    setIsEdit(true);
    setEditingId(appt.id);
    setFormError('');
    setForm({
      patient_id: appt.patient_id.toString(),
      doctor_id: appt.doctor_id.toString(),
      date: appt.date,
      time: appt.time,
      status: appt.status
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment? This updates status to Cancelled.')) {
      return;
    }
    try {
      await appointmentService.delete(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel appointment.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.patient_id || !form.doctor_id || !form.date || !form.time) {
      setFormError('Please complete all scheduling fields.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        patient_id: parseInt(form.patient_id),
        doctor_id: parseInt(form.doctor_id),
        date: form.date,
        time: form.time
      };

      if (isEdit) {
        await appointmentService.update(editingId, {
          ...payload,
          status: form.status
        });
      } else {
        await appointmentService.create(payload);
      }

      handleCloseModal();
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Double-booking conflict: This doctor is already booked for this slot.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Appointments Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Book patient consultations, reschedule calendar slots, and view clinician schedules.</p>
        </div>
        <button onClick={handleOpenAddModal} className="btn btn-primary" disabled={patients.length === 0 || doctors.length === 0}>
          <Plus size={18} /> Schedule Consultation
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters Area */}
      <div className="glass" style={{ padding: '1.25rem 1.75rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by patient or doctor name..."
            className="form-control"
            style={{ paddingLeft: '2.75rem', background: 'rgba(0,0,0,0.3)' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ minWidth: '180px' }}>
          <select 
            className="form-control" 
            style={{ background: 'rgba(0,0,0,0.3)' }}
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
          >
            <option value="">Filter by Doctor (All)</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.full_name}</option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: '160px' }}>
          <select 
            className="form-control" 
            style={{ background: 'rgba(0,0,0,0.3)' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Filter by Status (All)</option>
            <option value="Booked">Booked</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
          <Calendar size={48} style={{ marginBottom: '1rem', opacity: '0.5' }} />
          <p>No consultations booked.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id}>
                  <td style={{ fontWeight: '500' }}>{appt.patient?.full_name || 'Patient'}</td>
                  <td>{appt.doctor?.full_name || 'Doctor'}</td>
                  <td>
                    <span className="badge badge-info">{appt.doctor?.department}</span>
                  </td>
                  <td>{appt.date}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={14} color="var(--text-secondary)" />
                      {appt.time}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      appt.status === 'Completed' ? 'badge-success' : 
                      appt.status === 'Cancelled' ? 'badge-danger' : 'badge-warning'
                    }`}>{appt.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleOpenEditModal(appt)} 
                        className="btn btn-secondary btn-sm"
                        disabled={appt.status === 'Completed'}
                        style={{ padding: '0.4rem' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleCancel(appt.id)} 
                        className="btn btn-danger btn-sm"
                        disabled={appt.status !== 'Booked'}
                        style={{ padding: '0.4rem' }}
                      >
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

            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{isEdit ? 'Modify Consultation Booking' : 'Schedule New Consultation'}</h3>

            {formError && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span style={{ fontSize: '0.9rem' }}>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Select Patient */}
              <div className="form-group">
                <label className="form-label" htmlFor="patient_id">Patient</label>
                <select
                  id="patient_id"
                  className="form-control"
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                  disabled={isEdit}
                  required
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} (#PA0{p.id})</option>
                  ))}
                </select>
              </div>

              {/* Select Doctor */}
              <div className="form-group">
                <label className="form-label" htmlFor="doctor_id">Doctor</label>
                <select
                  id="doctor_id"
                  className="form-control"
                  value={form.doctor_id}
                  onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                  required
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.full_name} - {d.department}</option>
                  ))}
                </select>
              </div>

              {/* Select Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="date">Appointment Date</label>
                <input
                  id="date"
                  type="date"
                  className="form-control"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              {/* Select Time Slot */}
              <div className="form-group">
                <label className="form-label" htmlFor="time">Time Slot Shift</label>
                <select
                  id="time"
                  className="form-control"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  required
                >
                  <option value="">-- Choose Shift Slot --</option>
                  {selectedDoctorSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              {/* Select Status (only when editing) */}
              {isEdit && (
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label className="form-label" htmlFor="status">Consultation Status</label>
                  <select
                    id="status"
                    className="form-control"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="Booked">Booked</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : (isEdit ? 'Save Changes' : 'Confirm Booking')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManagement;
