import { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Placeholder for real notification fetching/socket logic
  useEffect(() => {
    // mock data
    setNotifications([
      { id: 1, title: 'Team Invite', message: 'You were invited to NeoHackers', time: '5m ago', read: false },
      { id: 2, title: 'Profile Updated', message: 'Your GitHub stats were synced', time: '1h ago', read: true }
    ]);
    setUnreadCount(1);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-input transition-colors focus:outline-none"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full ring-2 ring-main"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-input/50">
            <h3 className="font-semibold text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="text-xs text-primary hover:text-primary/80"
                onClick={() => setUnreadCount(0)}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-border last:border-0 hover:bg-input/30 transition-colors ${
                    !notif.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-text-primary">{notif.title}</p>
                    <span className="text-xs text-text-muted whitespace-nowrap ml-2">{notif.time}</span>
                  </div>
                  <p className="text-sm text-text-muted mt-1">{notif.message}</p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-muted">
                <p>No new notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
