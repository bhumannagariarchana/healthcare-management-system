import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboardService';
import prescriptionService from '../services/prescriptionService';
import { 
  Stethoscope, 
  Users, 
  Calendar, 
  FileText, 
  Activity, 
  Clipboard, 
  CheckCircle, 
  Clock, 
  ChevronRight,
  Printer,
  X,
  FileSpreadsheet
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Prescription modal state (for Doctors)
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [activeAppt, setActiveAppt] = useState(null);
  const [rxForm, setRxForm] = useState({
    medicine_name: '',
    dosage: '',
    duration: '',
    doctor_notes: ''
  });
  const [rxLoading, setRxLoading] = useState(false);
  const [rxError, setRxError] = useState('');

  // Detailed prescription view modal (for Patients)
  const [rxViewOpen, setRxViewOpen] = useState(false);
  const [activeRx, setActiveRx] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getStats();
      setData(res);
    } catch (err) {
      setError('Failed to fetch dashboard stats.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleOpenRxModal = (appt) => {
    setActiveAppt(appt);
    setRxError('');
    setRxForm({
      medicine_name: '',
      dosage: '',
      duration: '',
      doctor_notes: ''
    });
    setRxModalOpen(true);
  };

  const handleCloseRxModal = () => {
    setRxModalOpen(false);
    setActiveAppt(null);
  };

  const handleRxSubmit = async (e) => {
    e.preventDefault();
    setRxError('');
    if (!rxForm.medicine_name || !rxForm.dosage || !rxForm.duration) {
      setRxError('Please fill in medicine name, dosage, and duration.');
      return;
    }

    setRxLoading(true);
    try {
      await prescriptionService.create({
        patient_id: activeAppt.patient_id,
        doctor_id: activeAppt.doctor_id, // we don't have doctor_id directly in the formatting, let's make sure it's handled or we get it. Oh, wait, the API checks user_id so it sets doctor_id on the backend! Let's pass it anyway
        appointment_id: activeAppt.id,
        medicine_name: rxForm.medicine_name,
        dosage: rxForm.dosage,
        duration: rxForm.duration,
        doctor_notes: rxForm.doctor_notes
      });
      handleCloseRxModal();
      fetchStats(); // Refresh schedule & completed consultations
    } catch (err) {
      setRxError(err.response?.data?.detail || 'Failed to create prescription.');
    } finally {
      setRxLoading(false);
    }
  };

  const handleOpenRxView = (rx) => {
    setActiveRx(rx);
    setRxViewOpen(true);
  };

  const handleCloseRxView = () => {
    setRxViewOpen(false);
    setActiveRx(null);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="full-page-loader">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" style={{ margin: '2rem' }}>
        <span>{error}</span>
        <button onClick={fetchStats} className="btn btn-secondary btn-sm" style={{ marginLeft: '1rem' }}>Retry</button>
      </div>
    );
  }

  const { role, stats } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
          Welcome back, <span className="gradient-text">{data.role === 'Patient' || data.role === 'Doctor' ? data.todays_schedule?.[0]?.doctor_name || data.todays_appointments?.[0]?.patient_name || data.upcoming_appointments?.[0]?.patient_name || localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : 'User' : 'Administrator'}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Here's your summary for today, {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
      </div>

      {/* ==========================================
          1. ADMIN DASHBOARD
          ========================================== */}
      {role === 'Admin' && (
        <>
          <div className="grid-stats">
            <div className="glass stat-card">
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)' }}>
                <Stethoscope />
              </div>
              <div className="stat-info">
                <p>Total Doctors</p>
                <h3>{stats.total_doctors}</h3>
              </div>
            </div>

            <div className="glass stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                <Users />
              </div>
              <div className="stat-info">
                <p>Total Patients</p>
                <h3>{stats.total_patients}</h3>
              </div>
            </div>

            <div className="glass stat-card">
              <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-info)' }}>
                <Calendar />
              </div>
              <div className="stat-info">
                <p>All Bookings</p>
                <h3>{stats.total_appointments}</h3>
              </div>
            </div>

            <div className="glass stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
                <Activity />
              </div>
              <div className="stat-info">
                <p>Today's Consults</p>
                <h3>{stats.todays_appointments_count}</h3>
              </div>
            </div>
          </div>

          <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Today's Consultations Queue</h2>
              <button onClick={() => navigate('/appointments')} className="btn btn-secondary btn-sm">
                Manage Schedule <ChevronRight size={16} />
              </button>
            </div>
            {data.todays_appointments.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No consultations scheduled for today.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Department</th>
                      <th>Time Slot</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.todays_appointments.map((appt) => (
                      <tr key={appt.id}>
                        <td style={{ fontWeight: '500' }}>{appt.patient_name}</td>
                        <td>{appt.doctor_name}</td>
                        <td>{appt.department}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={14} color="var(--text-secondary)" />
                            {appt.time}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            appt.status === 'Completed' ? 'badge-success' : 
                            appt.status === 'Cancelled' ? 'badge-danger' : 'badge-info'
                          }`}>{appt.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==========================================
          2. RECEPTIONIST DASHBOARD
          ========================================== */}
      {role === 'Receptionist' && (
        <>
          <div className="grid-stats">
            <div className="glass stat-card">
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)' }}>
                <Clock />
              </div>
              <div className="stat-info">
                <p>Today's Bookings</p>
                <h3>{stats.todays_appointments_count}</h3>
              </div>
            </div>

            <div className="glass stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                <Calendar />
              </div>
              <div className="stat-info">
                <p>Upcoming Bookings</p>
                <h3>{stats.upcoming_appointments_count}</h3>
              </div>
            </div>

            <div className="glass stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/appointments')}>
              <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-info)' }}>
                <Clipboard />
              </div>
              <div className="stat-info">
                <p>Book Appointment</p>
                <h3 style={{ fontSize: '1.25rem', marginTop: '0.5rem', color: 'var(--color-info)' }}>Launch Scheduler</h3>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            {/* Today's Schedule */}
            <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Today's Scheduled Consultations</h2>
              </div>
              {data.todays_appointments.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No consultations scheduled for today.</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Department</th>
                        <th>Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.todays_appointments.map((appt) => (
                        <tr key={appt.id}>
                          <td style={{ fontWeight: '500' }}>{appt.patient_name}</td>
                          <td>{appt.doctor_name}</td>
                          <td>{appt.department}</td>
                          <td>{appt.time}</td>
                          <td>
                            <span className={`badge ${
                              appt.status === 'Completed' ? 'badge-success' : 
                              appt.status === 'Cancelled' ? 'badge-danger' : 'badge-info'
                            }`}>{appt.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Upcoming Schedule */}
            <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Upcoming Appointments Registry</h2>
              </div>
              {data.upcoming_appointments.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No upcoming bookings registered.</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.upcoming_appointments.map((appt) => (
                        <tr key={appt.id}>
                          <td style={{ fontWeight: '500' }}>{appt.patient_name}</td>
                          <td>{appt.doctor_name}</td>
                          <td>{appt.date}</td>
                          <td>{appt.time}</td>
                          <td>
                            <span className="badge badge-info">{appt.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ==========================================
          3. DOCTOR DASHBOARD
          ========================================== */}
      {role === 'Doctor' && (
        <>
          <div className="grid-stats">
            <div className="glass stat-card">
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)' }}>
                <Clock />
              </div>
              <div className="stat-info">
                <p>Today's Consultations</p>
                <h3>{stats.todays_appointments_count}</h3>
              </div>
            </div>

            <div className="glass stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                <CheckCircle />
              </div>
              <div className="stat-info">
                <p>Completed Consults</p>
                <h3>{stats.completed_consultations_count}</h3>
              </div>
            </div>
          </div>

          <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Today's Patient Schedule</h2>
            {data.todays_schedule.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No consultations scheduled for today.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Time Slot</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.todays_schedule.map((appt) => (
                      <tr key={appt.id}>
                        <td style={{ fontWeight: '500' }}>{appt.patient_name}</td>
                        <td>{appt.patient_age}</td>
                        <td>{appt.patient_gender}</td>
                        <td>{appt.time}</td>
                        <td>
                          <span className={`badge ${
                            appt.status === 'Completed' ? 'badge-success' : 
                            appt.status === 'Cancelled' ? 'badge-danger' : 'badge-info'
                          }`}>{appt.status}</span>
                        </td>
                        <td>
                          {appt.status === 'Booked' ? (
                            <button 
                              onClick={() => handleOpenRxModal(appt)}
                              className="btn btn-primary btn-sm"
                            >
                              Consult & Prescribe
                            </button>
                          ) : appt.status === 'Completed' ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Prescribed</span>
                          ) : (
                            <span style={{ color: 'var(--color-danger)', fontSize: '0.9rem' }}>Cancelled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==========================================
          4. PATIENT DASHBOARD
          ========================================== */}
      {role === 'Patient' && (
        <>
          <div className="grid-stats">
            <div className="glass stat-card">
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)' }}>
                <Calendar />
              </div>
              <div className="stat-info">
                <p>Upcoming Visits</p>
                <h3>{stats.upcoming_appointments_count}</h3>
              </div>
            </div>

            <div className="glass stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                <CheckCircle />
              </div>
              <div className="stat-info">
                <p>Previous Visits</p>
                <h3>{stats.previous_appointments_count}</h3>
              </div>
            </div>

            <div className="glass stat-card">
              <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-info)' }}>
                <FileText />
              </div>
              <div className="stat-info">
                <p>Prescriptions</p>
                <h3>{stats.prescriptions_count}</h3>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
            {/* Upcoming Appointments */}
            <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>My Upcoming Consultations</h2>
              {data.upcoming_appointments.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>No upcoming consultations scheduled. Contact receptionist to book one.</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Department</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.upcoming_appointments.map((appt) => (
                        <tr key={appt.id}>
                          <td style={{ fontWeight: '500' }}>{appt.doctor_name}</td>
                          <td>{appt.department}</td>
                          <td>{appt.date}</td>
                          <td>{appt.time}</td>
                          <td>
                            <span className="badge badge-info">{appt.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Prescriptions */}
            <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>My Prescriptions Medical Record</h2>
              {data.prescriptions.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>No prescriptions recorded.</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Medication</th>
                        <th>Dosage</th>
                        <th>Duration</th>
                        <th>Prescribed Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.prescriptions.map((rx) => (
                        <tr key={rx.id}>
                          <td style={{ fontWeight: '500' }}>{rx.doctor_name}</td>
                          <td style={{ color: 'var(--color-primary)', fontWeight: '600' }}>{rx.medicine_name}</td>
                          <td>{rx.dosage}</td>
                          <td>{rx.duration}</td>
                          <td>{rx.created_at.split(' ')[0]}</td>
                          <td>
                            <button 
                              onClick={() => handleOpenRxView(rx)}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Printer size={14} /> View Slip
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Previous History */}
            <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Consultations Log History</h2>
              {data.previous_appointments.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>No history of past consultations.</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Department</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.previous_appointments.map((appt) => (
                        <tr key={appt.id}>
                          <td style={{ fontWeight: '500' }}>{appt.doctor_name}</td>
                          <td>{appt.department}</td>
                          <td>{appt.date}</td>
                          <td>{appt.time}</td>
                          <td>
                            <span className={`badge ${
                              appt.status === 'Completed' ? 'badge-success' : 'badge-danger'
                            }`}>{appt.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ==========================================
          DOCTOR MODAL: CREATE PRESCRIPTION
          ========================================== */}
      {rxModalOpen && activeAppt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }} className="fade-in">
          <div className="glass" style={{
            width: '100%',
            maxWidth: '550px',
            padding: '2.5rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-glass)',
            position: 'relative'
          }}>
            <button 
              onClick={handleCloseRxModal}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Write Prescription</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Patient: <strong style={{ color: '#fff' }}>{activeAppt.patient_name}</strong> (Age {activeAppt.patient_age}, {activeAppt.patient_gender})
            </p>

            {rxError && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span style={{ fontSize: '0.9rem' }}>{rxError}</span>
              </div>
            )}

            <form onSubmit={handleRxSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="medicine_name">Medicine Name</label>
                <input
                  id="medicine_name"
                  type="text"
                  placeholder="e.g. Paracetamol / Amoxicillin"
                  className="form-control"
                  value={rxForm.medicine_name}
                  onChange={(e) => setRxForm({ ...rxForm, medicine_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="dosage">Dosage</label>
                  <input
                    id="dosage"
                    type="text"
                    placeholder="e.g. 500mg - 2x daily"
                    className="form-control"
                    value={rxForm.dosage}
                    onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="duration">Duration</label>
                  <input
                    id="duration"
                    type="text"
                    placeholder="e.g. 5 days"
                    className="form-control"
                    value={rxForm.duration}
                    onChange={(e) => setRxForm({ ...rxForm, duration: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" htmlFor="doctor_notes">Doctor's Consultation Notes</label>
                <textarea
                  id="doctor_notes"
                  placeholder="Additional patient guidance or dietary restrictions..."
                  className="form-control"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  value={rxForm.doctor_notes}
                  onChange={(e) => setRxForm({ ...rxForm, doctor_notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={handleCloseRxModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={rxLoading}>
                  {rxLoading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : 'Publish & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          PATIENT MODAL: PRINT/VIEW PRESCRIPTION SLIP
          ========================================== */}
      {rxViewOpen && activeRx && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }} className="fade-in">
          <div className="glass" style={{
            width: '100%',
            maxWidth: '600px',
            padding: '3rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-glass)',
            position: 'relative',
            background: '#ffffff',
            color: '#1e293b'
          }} id="printable-rx-card">
            <button 
              onClick={handleCloseRxView}
              className="no-print"
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>

            {/* Print Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '3px solid #6366f1',
              paddingBottom: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div>
                <h2 style={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: '800' }}>CAREPULSE MEDICAL CLINIC</h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>123 Health Ave, Medical District, NY 10001</p>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Phone: (555) 019-2834 | contact@carepulse.com</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h4 style={{ color: '#6366f1', fontSize: '1.25rem', fontWeight: '700' }}>PRESCRIPTION</h4>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Date: {activeRx.created_at.split(' ')[0]}</p>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Rx ID: #00{activeRx.id}</p>
              </div>
            </div>

            {/* Print Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prescribing Physician</p>
                <p style={{ fontWeight: '700', fontSize: '1.05rem' }}>{activeRx.doctor_name}</p>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Department of Cardiology</p>
              </div>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient Record Card</p>
                <p style={{ fontWeight: '700', fontSize: '1.05rem' }}>{localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : 'Patient'}</p>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Record Card Verified</p>
              </div>
            </div>

            {/* Rx Medication Content */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#6366f1', float: 'left', lineHeight: '1', marginRight: '0.75rem', marginTop: '-0.25rem' }}>℞</span>
              <div style={{ marginLeft: '2.5rem' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>{activeRx.medicine_name}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  <p><strong>Dosage:</strong> {activeRx.dosage}</p>
                  <p><strong>Duration:</strong> {activeRx.duration}</p>
                </div>
                {activeRx.doctor_notes && (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', fontSize: '0.85rem', color: '#475569' }}>
                    <strong>Doctor Instructions:</strong>
                    <p style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>"{activeRx.doctor_notes}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Signature Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '3rem' }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                * This is a digitally signed e-prescription.
              </div>
              <div style={{ textAlign: 'center', width: '180px' }}>
                <div style={{ fontStyle: 'italic', fontFamily: 'cursive', fontSize: '1.1rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                  {activeRx.doctor_name}
                </div>
                <p style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Authorized Signature</p>
              </div>
            </div>

            {/* Actions for modal */}
            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }} className="no-print">
              <button onClick={handleCloseRxView} className="btn btn-secondary">
                Close
              </button>
              <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Printer size={16} /> Print Prescription
              </button>
            </div>

            {/* CSS print media styles specifically for this print preview */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #printable-rx-card, #printable-rx-card * {
                  visibility: visible;
                }
                #printable-rx-card {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  border: none !important;
                  box-shadow: none !important;
                  background: white !important;
                  padding: 0 !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
