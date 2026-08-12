import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import authService from '../services/authService';
import { 
  LayoutDashboard, 
  Stethoscope, 
  Users, 
  Calendar, 
  FileText, 
  User, 
  LogOut, 
  Menu, 
  X,
  HeartPulse,
  ShieldCheck
} from 'lucide-react';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const getNavigationLinks = () => {
    const role = currentUser.role;
    const links = [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    ];

    if (role === 'Admin') {
      links.push(
        { path: '/doctors', label: 'Doctors', icon: Stethoscope },
        { path: '/receptionists', label: 'Receptionists', icon: ShieldCheck },
        { path: '/patients', label: 'Patients Registry', icon: Users },
        { path: '/appointments', label: 'Appointments', icon: Calendar }
      );
    } else if (role === 'Receptionist') {
      links.push(
        { path: '/patients', label: 'Patients', icon: Users },
        { path: '/appointments', label: 'Bookings', icon: Calendar }
      );
    } else if (role === 'Doctor') {
      links.push(
        { path: '/appointments', label: 'My Schedule', icon: Calendar }
      );
    } else if (role === 'Patient') {
      // Patient dashboard is enough for their view
    }

    links.push({ path: '/profile', label: 'My Profile', icon: User });
    return links;
  };

  const navLinks = getNavigationLinks();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin': return <span className="badge badge-danger">Admin</span>;
      case 'Receptionist': return <span className="badge badge-warning">Receptionist</span>;
      case 'Doctor': return <span className="badge badge-info">Doctor</span>;
      case 'Patient': return <span className="badge badge-success">Patient</span>;
      default: return <span className="badge">{role}</span>;
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Menu Toggle */}
      <button 
        className="btn btn-secondary btn-sm"
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: '999',
          display: 'none',
          padding: '0.5rem',
        }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        id="mobile-sidebar-toggle"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* CSS overrides for mobile toggle visibility */}
      <style>{`
        @media (max-width: 1024px) {
          #mobile-sidebar-toggle {
            display: inline-flex !important;
          }
          .sidebar {
            transform: translateX(${sidebarOpen ? '0' : '-100%'});
          }
          .main-content {
            margin-left: 0;
            padding-top: 4.5rem;
          }
        }
      `}</style>

      {/* Sidebar Navigation */}
      <aside className={`sidebar`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div style={{
            background: 'var(--color-primary)',
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <HeartPulse size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }} className="gradient-text">CarePulse</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MANAGEMENT SYSTEM</p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="glass"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: isActive ? '600' : '400',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  transition: 'all var(--transition-fast)'
                }}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} color={isActive ? 'var(--color-primary)' : 'var(--text-secondary)'} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Footer in Sidebar */}
        <div style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600'
            }}>
              {currentUser.username[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.username}
              </p>
              {getRoleBadge(currentUser.role)}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <main className="main-content">
        <div className="fade-in" style={{ flex: 1 }}>
          {children}
        </div>
        <footer style={{
          marginTop: '4rem',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem'
        }}>
          CarePulse Portfolio Project &copy; {new Date().getFullYear()} - SDE Internship Demo
        </footer>
      </main>
    </div>
  );
};

export default MainLayout;
