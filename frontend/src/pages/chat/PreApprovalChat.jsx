import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { 
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockClosedIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const PreApprovalChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [request, setRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchMessagesOnly, 10000); // poll every 10s
    return () => clearInterval(intervalId);
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, msgRes] = await Promise.all([
        axios.get(`/join-request/${id}`),
        axios.get(`/request-chat/${id}`)
      ]);
      setRequest(reqRes.data?.data || reqRes.data);
      setMessages(msgRes.data?.data || msgRes.data || []);
      
      // mark as read
      await axios.patch(`/request-chat/read/${id}`).catch(() => {});
    } catch (error) {
      toast.error('Failed to load chat');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessagesOnly = async () => {
    try {
      const res = await axios.get(`/request-chat/${id}`);
      setMessages(res.data?.data || res.data || []);
    } catch (error) {
      // quiet fail on poll
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // optimistic clear
    setSending(true);

    // Optimistic UI update
    const optimisticMsg = {
      _id: Date.now().toString(),
      sender: user,
      content: messageContent,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await axios.post(`/request-chat/send/${id}`, { content: messageContent });
      // We rely on the poll or optimistic update, but can also fetch to confirm
      fetchMessagesOnly();
    } catch (error) {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id)); // rollback
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAccept = async () => {
    if (!window.confirm('Accept this applicant?')) return;
    try {
      setActionLoading(true);
      await axios.patch(`/join-request/accept/${id}`);
      toast.success('Applicant accepted!');
      fetchData(); // refresh status
    } catch (error) {
      toast.error('Failed to accept');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Reject this applicant?')) return;
    try {
      setActionLoading(true);
      await axios.patch(`/join-request/reject/${id}`, { rejectionReason: 'Rejected after interview chat.' });
      toast.success('Applicant rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  if (!request) return null;

  const requestLeaderId = typeof request.team?.leader === 'object' ? request.team?.leader?._id : request.team?.leader;
  const isLeader = requestLeaderId && user?._id && String(requestLeaderId).trim().toLowerCase() === String(user._id).trim().toLowerCase();
  const isPending = request.status === 'pending';

  // Group messages by date (simple implementation)
  let lastDate = null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Bar */}
      <div className="bg-card border border-border rounded-t-xl p-4 flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-input text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-text-primary text-lg leading-tight">
              {(request.sender || request.user)?.name} <span className="text-text-muted font-normal mx-1">→</span> {request.team?.name || request.team?.teamName}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">Role: {request.appliedRole}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            request.status === 'pending' ? 'bg-warning/20 text-warning border border-warning/30' :
            request.status === 'accepted' ? 'bg-success/20 text-success border border-success/30' :
            'bg-danger/20 text-danger border border-danger/30'
          }`}>
            {request.status}
          </span>
          
          {isLeader && isPending && (
            <div className="flex items-center gap-2 border-l border-border pl-4">
              <button onClick={handleAccept} disabled={actionLoading} className="flex items-center gap-1 px-3 py-1.5 bg-success text-white rounded-lg text-xs font-medium hover:bg-success/90 transition-colors disabled:opacity-50">
                <CheckCircleIcon className="w-4 h-4" /> Accept
              </button>
              <button onClick={handleReject} disabled={actionLoading} className="flex items-center gap-1 px-3 py-1.5 bg-danger text-white rounded-lg text-xs font-medium hover:bg-danger/90 transition-colors disabled:opacity-50">
                <XCircleIcon className="w-4 h-4" /> Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-main border-x border-border overflow-y-auto p-6 flex flex-col gap-4 relative">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted my-auto">
            <ChatBubbleLeftRightIcon className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm">Start the interview conversation here.</p>
            <p className="text-xs mt-1">Messages are end-to-end encrypted.*</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
            const msgDate = new Date(msg.createdAt).toLocaleDateString();
            const showDate = msgDate !== lastDate;
            lastDate = msgDate;

            return (
              <React.Fragment key={msg._id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="bg-card border border-border text-text-muted text-[10px] font-semibold px-3 py-1 rounded-full tracking-widest uppercase">
                      {msgDate === new Date().toLocaleDateString() ? 'Today' : msgDate}
                    </span>
                  </div>
                )}
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                  {!isMe && (
                    <span className="text-xs text-text-muted mb-1 ml-1 font-medium">{msg.sender?.name}</span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${
                    isMe 
                      ? 'bg-primary text-white rounded-tr-sm' 
                      : 'bg-card border border-border text-text-primary rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className={`text-[10px] text-text-muted mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isPending ? (
        <div className="bg-input/80 border border-border rounded-b-xl p-4 shrink-0 flex items-center justify-center gap-2 text-text-muted text-sm font-medium">
          <LockClosedIcon className="w-5 h-5" />
          This chat is locked — request has been resolved
        </div>
      ) : (
        <div className="bg-card border border-border rounded-b-xl p-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
          <form onSubmit={handleSend} className="flex items-end gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={500}
                placeholder="Message..."
                className="w-full bg-input border border-border rounded-xl pl-4 pr-12 py-3 text-sm text-text-primary resize-none focus:outline-none focus:border-primary transition-colors scrollbar-hide min-h-[46px] max-h-[120px]"
                rows={newMessage.split('\n').length > 1 ? Math.min(newMessage.split('\n').length, 5) : 1}
              />
              <span className={`absolute right-3 bottom-3 text-[10px] font-medium transition-colors ${
                newMessage.length > 450 ? 'text-danger' : 'text-text-muted/50'
              }`}>
                {newMessage.length}/500
              </span>
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:hover:bg-primary flex-shrink-0"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-text-muted">Press Enter to send, Shift + Enter for newline</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreApprovalChat;
