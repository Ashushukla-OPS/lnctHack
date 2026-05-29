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
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={handleToggleOpen}
        className="relative p-2.5 rounded-xl text-text-muted hover:text-white hover:bg-[#1a1a20] border border-transparent hover:border-[#232329] transition-all focus:outline-none"
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#0c0c0e] animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 glass-card bg-[#141417]/95 border border-[#232329] rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in font-sans">
          <div className="p-4 border-b border-[#232329] flex justify-between items-center bg-[#1c1c21]/80 backdrop-blur-sm">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="text-xs text-violet-400 hover:text-violet-300 font-bold transition-colors"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto divide-y divide-[#232329] scrollbar-hide">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 hover:bg-[#1a1a22]/50 cursor-pointer transition-colors relative ${
                    !notif.isRead ? 'bg-violet-500/5' : ''
                  }`}
                >
                  {!notif.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-violet-500"></div>
                  )}
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <p className={`text-[10px] font-black uppercase tracking-wider ${!notif.isRead ? 'text-violet-400' : 'text-text-muted'}`}>
                      {notif.type?.replace(/_/g, ' ') || 'Alert'}
                    </p>
                    <span className="text-[9px] text-text-muted whitespace-nowrap">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`text-xs text-text-muted leading-relaxed ${!notif.isRead ? 'font-bold text-white' : 'font-medium'}`}>
                    {notif.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-muted flex flex-col items-center justify-center">
                <span className="text-2xl block mb-1">🔔</span>
                <p className="text-xs font-semibold">All caught up!</p>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-[#232329] text-center bg-[#18181c]/40">
            <Link to="/notifications" onClick={() => setIsOpen(false)} className="text-xs text-violet-400 font-bold hover:text-violet-300 hover:underline">
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
