import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Sparkles,
  LayoutDashboard,
  PlayCircle,
  History,
  User,
  LogOut,
  LogIn,
  UserPlus
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Active section tracking for Home, Features, How It Works
  const [activeSection, setActiveSection] = useState('home');

  // Listen to scroll & hash on Home page to update active section dynamically
  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('');
      return;
    }

    // If there is an initial hash in URL
    if (location.hash === '#features') {
      setActiveSection('features');
    } else if (location.hash === '#how-it-works') {
      setActiveSection('how-it-works');
    } else {
      setActiveSection('home');
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      const featuresEl = document.getElementById('features');
      const howItWorksEl = document.getElementById('how-it-works');
      const heroEl = document.getElementById('hero');

      if (howItWorksEl && scrollPosition >= howItWorksEl.offsetTop) {
        setActiveSection('how-it-works');
      } else if (featuresEl && scrollPosition >= featuresEl.offsetTop) {
        setActiveSection('features');
      } else if (heroEl || scrollPosition < 400) {
        setActiveSection('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, location.hash]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSectionClick = (sectionId) => {
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      return;
    }

    setActiveSection(sectionId);
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.history.pushState) {
        window.history.pushState(null, '', '/');
      }
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        if (window.history.pushState) {
          window.history.pushState(null, '', `/#${sectionId}`);
        }
      }
    }
  };

  const isRouteActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" onClick={() => handleSectionClick('home')} className="nav-brand">
          <div className="nav-brand-icon">
            <Sparkles size={20} color="#ffffff" />
          </div>
          <span>InterviewAI</span>
        </Link>

        <div className="nav-links">
          <button
            type="button"
            onClick={() => handleSectionClick('home')}
            className={`nav-link ${location.pathname === '/' && activeSection === 'home' ? 'active' : ''}`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleSectionClick('features')}
            className={`nav-link ${location.pathname === '/' && activeSection === 'features' ? 'active' : ''}`}
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => handleSectionClick('how-it-works')}
            className={`nav-link ${location.pathname === '/' && activeSection === 'how-it-works' ? 'active' : ''}`}
          >
            How It Works
          </button>

          {user && (
            <>
              <Link
                to="/dashboard"
                className={`nav-link ${isRouteActive('/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <Link
                to="/interview/setup"
                className={`nav-link ${isRouteActive('/interview/setup') ? 'active' : ''}`}
              >
                New Interview
              </Link>
              <Link
                to="/history"
                className={`nav-link ${isRouteActive('/history') ? 'active' : ''}`}
              >
                History
              </Link>
            </>
          )}
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <Link
                to="/profile"
                className={`user-menu-pill ${isRouteActive('/profile') ? 'active' : ''}`}
              >
                <div className="user-avatar-circle">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{user.name.split(' ')[0]}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="btn btn-outline-white btn-sm"
                title="Log out"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline-white btn-sm">
                <LogIn size={16} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={16} />
                <span>Sign Up</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
