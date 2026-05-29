import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Teams', path: '/teams' },
    { name: 'Hackathons', path: '/hackathons' },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-main/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-white">
                P
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block">
                ProvenStack
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname.startsWith(link.path)
                    ? 'text-primary'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center space-x-4">
            <NotificationBell />
            
            <div className="h-6 w-px bg-border"></div>

            <Link
              to="/profile"
              className="flex items-center gap-2 hover:bg-input px-3 py-1.5 rounded-lg transition-colors"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-8 h-8 rounded-full border border-border object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-input flex items-center justify-center text-text-primary font-medium border border-border">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </Link>
            
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-text-muted hover:text-danger transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-input focus:outline-none"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card border-b border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname.startsWith(link.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-input hover:text-text-primary'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-text-muted hover:bg-input hover:text-text-primary"
            >
              Profile
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-danger hover:bg-danger/10"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
