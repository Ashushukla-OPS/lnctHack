import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { 
  BellIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleOvalLeftIcon,
  UsersIcon,
  ArrowLeftOnRectangleIcon,
  StarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/notifications');
      setNotifications(res.data?.data || res.data || []);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await axios.patch(`/notifications/read/${notif._id}`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      } catch (err) {
        // ignore
      }
    }

    // Routing logic based on type
    switch (notif.type) {
      case 'join_interest':
      case 'member_left':
        navigate('/leader');
        break;
      case 'request_accepted':
        navigate('/teams');
        break;
      case 'request_rejected':
        break; // stay here
      case 'new_message':
        if (notif.relatedId) navigate(`/chat/team/${notif.relatedId}`);
        break;
      case 'team_update':
      case 'slot_filled':
        if (notif.relatedId) navigate(`/teams/${notif.relatedId}`);
        break;
      case 'hackathon_reminder':
        if (notif.relatedId) navigate(`/hackathons/${notif.relatedId}`);
        break;
      default:
        break;
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      setNotifications(prev => prev.filter(n => n._id !== id));
      await axios.delete(`/notifications/${id}`);
    } catch (error) {
      toast.error('Failed to delete notification');
      fetchNotifications(); // rollback
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'join_interest': return <UserPlusIcon className="w-5 h-5 text-primary" />;
      case 'request_accepted': return <CheckCircleIcon className="w-5 h-5 text-success" />;
      case 'request_rejected': return <XCircleIcon className="w-5 h-5 text-danger" />;
      case 'new_message': return <ChatBubbleOvalLeftIcon className="w-5 h-5 text-primary" />;
      case 'team_update': return <UsersIcon className="w-5 h-5 text-accent" />;
      case 'member_left': return <ArrowLeftOnRectangleIcon className="w-5 h-5 text-warning" />;
      case 'hackathon_reminder': return <BellIcon className="w-5 h-5 text-warning" />;
      case 'slot_filled': return <StarIcon className="w-5 h-5 text-success" />;
      default: return <BellIcon className="w-5 h-5 text-text-muted" />;
    }
  };

  const filterNotifications = () => {
    if (activeTab === 'All') return notifications;
    if (activeTab === 'Unread') return notifications.filter(n => !n.isRead);
    if (activeTab === 'Team') return notifications.filter(n => ['team_update', 'member_left', 'new_message', 'slot_filled'].includes(n.type));
    if (activeTab === 'Requests') return notifications.filter(n => ['join_interest', 'request_accepted', 'request_rejected'].includes(n.type));
    if (activeTab === 'Hackathons') return notifications.filter(n => ['hackathon_reminder'].includes(n.type));
    return notifications;
  };

  const filtered = filterNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-text-primary">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm font-medium text-primary border border-primary hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6 flex overflow-x-auto scrollbar-hide">
        {['All', 'Unread', 'Team', 'Requests', 'Hackathons'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        {filtered.length > 0 ? (
          <div className="divide-y divide-border">
            {filtered.map(notif => (
              <div 
                key={notif._id} 
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 flex gap-4 cursor-pointer hover:bg-input/50 transition-colors group relative ${
                  !notif.isRead ? 'bg-primary/5' : ''
                }`}
              >
                {!notif.isRead && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r"></div>
                )}
                
                <div className="mt-1 flex-shrink-0 bg-input p-2 rounded-full border border-border">
                  {getIconForType(notif.type)}
                </div>
                
                <div className="flex-1 min-w-0 pr-8">
                  <p className={`text-sm text-text-primary ${!notif.isRead ? 'font-semibold' : 'font-normal'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                </div>

                <button 
                  onClick={(e) => handleDelete(e, notif._id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center">
            <EmptyState 
              icon={<BellIcon className="w-12 h-12 text-border" />}
              title={activeTab === 'All' ? "You're all caught up! 🎉" : activeTab === 'Unread' ? "No unread notifications" : "No notifications in this category"}
              description="When you get updates, they'll show up here."
            />
          </div>
        )}
      </div>
      
      {filtered.length > 0 && (
        <div className="mt-6 text-center">
          <button className="text-sm font-medium text-text-muted hover:text-primary transition-colors py-2 px-4 rounded-lg hover:bg-input">
            Load more
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
