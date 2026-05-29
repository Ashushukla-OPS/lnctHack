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
      setNotifications(res.data?.data?.notifications || res.data?.notifications || res.data?.data || res.data || []);
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
      case 'join_interest': return <UserPlusIcon className="w-5 h-5 text-violet-400" />;
      case 'request_accepted': return <CheckCircleIcon className="w-5 h-5 text-emerald-400" />;
      case 'request_rejected': return <XCircleIcon className="w-5 h-5 text-rose-400" />;
      case 'new_message': return <ChatBubbleOvalLeftIcon className="w-5 h-5 text-violet-400" />;
      case 'team_update': return <UsersIcon className="w-5 h-5 text-sky-400" />;
      case 'member_left': return <ArrowLeftOnRectangleIcon className="w-5 h-5 text-amber-400" />;
      case 'hackathon_reminder': return <BellIcon className="w-5 h-5 text-amber-400" />;
      case 'slot_filled': return <StarIcon className="w-5 h-5 text-emerald-400" />;
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)] space-y-8 animate-fade-in font-sans relative overflow-hidden">
      
      {/* Ambient background flares */}
      <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#232329] pb-6 relative z-10">
        <div className="flex items-center gap-3">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shadow-violet-500/10 tracking-wider">
              {unreadCount} UNREAD
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-white bg-[#1e1e24] hover:bg-[#25252d] border border-[#2c2c35] hover:border-violet-500/30 px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <span>✔</span> Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-[#232329] mb-6 flex overflow-x-auto scrollbar-hide relative z-10">
        {['All', 'Unread', 'Team', 'Requests', 'Hackathons'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-6 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-text-muted hover:text-text-primary hover:border-[#232329]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="glass-card bg-[#141417]/85 border border-[#232329] rounded-2xl shadow-xl overflow-hidden min-h-[400px] relative z-10">
        {filtered.length > 0 ? (
          <div className="divide-y divide-[#232329]">
            {filtered.map(notif => (
              <div 
                key={notif._id} 
                onClick={() => handleNotificationClick(notif)}
                className={`p-5 flex gap-4 cursor-pointer hover:bg-[#1a1a22]/50 transition-colors group relative items-start ${
                  !notif.isRead ? 'bg-violet-500/5' : ''
                }`}
              >
                {!notif.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-violet-500"></div>
                )}
                
                <div className="flex-shrink-0 bg-[#1a1a20] border border-[#2c2c35] p-2.5 rounded-xl group-hover:border-violet-500/20 transition-all shadow-sm">
                  {getIconForType(notif.type)}
                </div>
                
                <div className="flex-1 min-w-0 pr-8">
                  <p className={`text-xs text-text-muted font-bold uppercase tracking-wider mb-1 flex items-center gap-2`}>
                    <span>{notif.type?.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-[#2c2c35] font-black">•</span>
                    <span className="text-[10px] font-normal normal-case">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</span>
                  </p>
                  <p className={`text-sm text-text-muted leading-relaxed ${!notif.isRead ? 'font-bold text-white' : 'font-medium'}`}>
                    {notif.message}
                  </p>
                </div>

                <button 
                  onClick={(e) => handleDelete(e, notif._id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center">
            <EmptyState 
              icon={<span className="text-4xl block mb-2 select-none">🔔</span>}
              title={activeTab === 'All' ? "You're all caught up! 🎉" : activeTab === 'Unread' ? "No unread notifications" : "No notifications in this category"}
              description="When new team updates or join requests arrive, they'll instantly appear here."
            />
          </div>
        )}
      </div>
      
      {filtered.length > 0 && (
        <div className="mt-6 text-center relative z-10">
          <button className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-all py-2.5 px-5 rounded-xl bg-[#1e1e24] hover:bg-[#25252d] border border-[#2c2c35] hover:border-violet-500/20 shadow-md">
            Load More Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
