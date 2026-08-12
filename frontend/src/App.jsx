import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import authService from './services/authService';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DoctorManagement from './pages/DoctorManagement';
import ReceptionistManagement from './pages/ReceptionistManagement';
import PatientManagement from './pages/PatientManagement';
import AppointmentManagement from './pages/AppointmentManagement';
import Profile from './pages/Profile';

// Layout
import MainLayout from './layouts/MainLayout';

// Guarded Route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = authService.getToken();
  const currentUser = authService.getCurrentUser();

  if (!token || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Role not authorized, bounce back to dashboard
    return <Navigate to="/" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Scoped Guarded Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist', 'Doctor', 'Patient']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/doctors"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <DoctorManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receptionists"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ReceptionistManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patients"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
              <PatientManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist', 'Doctor']}>
              <AppointmentManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist', 'Doctor', 'Patient']}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Fallback to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
