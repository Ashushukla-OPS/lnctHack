import { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import axios from '../utils/axios';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

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

  const fetchNotifications = async () => {
    try {
      const [notifRes, unreadRes] = await Promise.all([
        axios.get('/notifications?limit=5'),
        axios.get('/notifications/unread-count')
      ]);
      
      const fetchedNotifications = notifRes.data?.data?.notifications || notifRes.data?.notifications || [];
      const fetchedCount = unreadRes.data?.data?.count || unreadRes.data?.count || 0;
      
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedCount);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleOpen = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await axios.patch(`/notifications/read/${notif._id}`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read', err);
      }
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggleOpen}
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
                className="text-xs text-primary hover:text-primary/80 font-medium"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 hover:bg-input/30 cursor-pointer transition-colors relative ${
                    !notif.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  {!notif.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"></div>
                  )}
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-xs font-semibold uppercase tracking-wider ${!notif.isRead ? 'text-primary' : 'text-text-muted'}`}>
                      {notif.type?.replace(/_/g, ' ') || 'Alert'}
                    </p>
                    <span className="text-[10px] text-text-muted whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`text-sm text-text-primary ${!notif.isRead ? 'font-medium' : 'font-normal'}`}>
                    {notif.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-muted">
                <p>No new notifications</p>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-border text-center bg-input/20">
            <Link to="/notifications" onClick={() => setIsOpen(false)} className="text-xs text-primary font-medium hover:underline">
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
