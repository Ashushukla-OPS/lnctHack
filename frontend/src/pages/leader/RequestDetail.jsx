import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../utils/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/join-request/${id}`);
      setRequest(res.data?.data || res.data);
    } catch (error) {
      toast.error('Failed to load request details');
      navigate('/leader');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!window.confirm('Are you sure you want to accept this member into the team?')) return;
    try {
      setActionLoading(true);
      await axios.patch(`/join-request/accept/${id}`);
      toast.success('Member added successfully!');
      navigate('/leader');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept request');
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return toast.error('Reason is required');
    try {
      setActionLoading(true);
      await axios.patch(`/join-request/reject/${id}`, { rejectionReason });
      toast.success('Request rejected');
      navigate('/leader');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  if (!request) return null;

  const sender = request.sender || request.user;
  const team = request.team;
  const isPending = request.status === 'pending';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link to="/leader" className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors mb-4">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-text-primary">Application Review</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Request Header Card */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-input border-2 border-border flex items-center justify-center font-bold text-xl text-text-primary">
                  {sender?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{sender?.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/30 uppercase tracking-wide font-medium">
                      {sender?.tier || 'Newbie'}
                    </span>
                    <span className="text-xs font-medium text-text-muted flex items-center gap-1">
                      <StarIcon className="w-3.5 h-3.5 text-warning" /> {sender?.scores?.total || sender?.score?.totalScore || 0} Rep
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-text-muted">Applied for</div>
                <div className="font-semibold text-text-primary bg-input px-3 py-1 rounded-lg inline-block mt-1">
                  {request.appliedRole}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-text-muted mb-2">Target Team</p>
              <p className="font-semibold text-text-primary">{team?.teamName || team?.name}</p>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-text-muted">Message</p>
                <span className="text-xs text-text-muted">
                  {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="bg-input/50 border border-border rounded-lg p-4 text-sm text-text-primary">
                {request.message ? `"${request.message}"` : <span className="italic text-text-muted">No message provided.</span>}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-text-muted mb-2">Current Status</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                request.status === 'pending' ? 'bg-warning/20 text-warning border border-warning/30' :
                request.status === 'accepted' ? 'bg-success/20 text-success border border-success/30' :
                'bg-danger/20 text-danger border border-danger/30'
              }`}>
                {request.status}
              </span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-text-primary">Applicant Interview</h3>
              <p className="text-sm text-text-muted">Talk to the applicant before making a decision.</p>
            </div>
            <Link to={`/chat/request/${request._id}`} className="px-4 py-2 border border-primary text-primary hover:bg-primary/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5" /> Chat
            </Link>
          </div>
        </div>

        {/* Sender Score Card & Actions */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-text-primary mb-6 text-center border-b border-border pb-4">Applicant Scorecard</h3>
            
            <div className="text-center mb-6">
              <span className="text-4xl font-black text-primary">{sender?.scores?.total || sender?.score?.totalScore || 0}</span>
              <span className="text-text-muted font-medium ml-1">/ 1000</span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted flex items-center gap-1.5"><CodeBracketIcon className="w-4 h-4"/> GitHub</span>
                <span className="font-medium text-text-primary">{sender?.scores?.github || sender?.score?.breakdown?.github || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted flex items-center gap-1.5"><span className="font-mono">LC</span> LeetCode</span>
                <span className="font-medium text-text-primary">{sender?.scores?.leetcode || sender?.score?.breakdown?.leetcode || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted flex items-center gap-1.5"><span className="font-mono">CF</span> Codeforces</span>
                <span className="font-medium text-text-primary">{sender?.scores?.cf || sender?.scores?.codeforces || sender?.score?.breakdown?.codeforces || 0}</span>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Top Languages</p>
              <div className="flex flex-wrap gap-2">
                {sender?.topLanguages?.length > 0 ? (
                  sender.topLanguages.map((lang, idx) => (
                    <span key={idx} className="bg-input border border-border px-2 py-1 rounded text-xs text-text-primary">
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-text-muted italic">Unknown</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Deployed Projects</p>
              <span className="font-medium text-text-primary bg-input px-3 py-1 rounded-lg text-sm border border-border">
                {sender?.scores?.projects || sender?.score?.breakdown?.deployedProjects || 0}
              </span>
            </div>
          </div>

          {isPending && (
            <div className="space-y-3">
              {!rejecting ? (
                <>
                  <button onClick={handleAccept} disabled={actionLoading} className="w-full py-2.5 bg-success text-white hover:bg-success/90 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-5 h-5" /> Accept Applicant
                  </button>
                  <button onClick={() => setRejecting(true)} disabled={actionLoading} className="w-full py-2.5 border-2 border-danger text-danger hover:bg-danger/10 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    <XCircleIcon className="w-5 h-5" /> Reject Application
                  </button>
                </>
              ) : (
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-text-muted mb-2">Rejection Reason</label>
                  <textarea
                    required
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason..."
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:border-danger transition-colors mb-3"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setRejecting(false)} className="flex-1 py-2 bg-input text-text-muted hover:bg-input/80 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                    <button onClick={handleReject} disabled={actionLoading} className="flex-1 py-2 bg-danger text-white hover:bg-danger/90 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Confirm</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;
