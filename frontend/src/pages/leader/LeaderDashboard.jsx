import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { 
  UserGroupIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ChatBubbleLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const LeaderDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data
  const [myTeams, setMyTeams] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  
  // UI State
  const [activeTeamId, setActiveTeamId] = useState(null);

  // Modals
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Slot Modals
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [slotModalMode, setSlotModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [slotForm, setSlotForm] = useState({ role: '', minScore: 0, requiredSkills: [], skillInput: '' });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, reqsRes] = await Promise.all([
        axios.get('/teams'),
        axios.get('/join-request/incoming')
      ]);

      const allTeams = teamsRes.data?.teams || teamsRes.data?.data || teamsRes.data || [];
      const leaderTeams = allTeams.filter(t => t.leader?._id === user?._id || t.leader === user?._id);
      setMyTeams(leaderTeams);
      
      if (leaderTeams.length > 0 && !activeTeamId) {
        setActiveTeamId(leaderTeams[0]._id);
      }

      setIncomingRequests(reqsRes.data?.data || reqsRes.data || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    if (!window.confirm('Are you sure you want to accept this member?')) return;
    try {
      setActionLoading(true);
      await axios.patch(`/join-request/accept/${id}`);
      toast.success('Member added!');
      fetchData(); // Refresh all to get updated slots and requests
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (id) => {
    setSelectedRequestId(id);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return toast.error('Reason is required');
    try {
      setActionLoading(true);
      await axios.patch(`/join-request/reject/${selectedRequestId}`, { rejectionReason });
      toast.success('Request rejected');
      setRejectModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveSlot = async (teamId, slotId) => {
    if (!window.confirm('Are you sure you want to remove this slot?')) return;
    try {
      await axios.patch(`/teams/${teamId}/slots/remove/${slotId}`);
      toast.success('Slot removed');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove slot');
    }
  };

  const openAddSlot = () => {
    setSlotModalMode('add');
    setSlotForm({ role: '', minScore: 0, requiredSkills: [], skillInput: '' });
    setSlotModalOpen(true);
  };

  const openEditSlot = (slot) => {
    setSlotModalMode('edit');
    setSelectedSlotId(slot._id);
    setSlotForm({ role: slot.role, minScore: slot.minScore || 0, requiredSkills: slot.requiredSkills || [], skillInput: '' });
    setSlotModalOpen(true);
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = slotForm.skillInput.trim();
      if (val && !slotForm.requiredSkills.includes(val)) {
        setSlotForm(prev => ({
          ...prev,
          requiredSkills: [...prev.requiredSkills, val],
          skillInput: ''
        }));
      }
    }
  };

  const removeSkill = (index) => {
    setSlotForm(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((_, i) => i !== index)
    }));
  };

  const handleSlotSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const payload = {
        role: slotForm.role,
        minScore: Number(slotForm.minScore),
        requiredSkills: slotForm.requiredSkills
      };

      if (slotModalMode === 'add') {
        await axios.patch(`/teams/${activeTeamId}/slots/add`, payload);
        toast.success('Slot added');
      } else {
        await axios.patch(`/teams/${activeTeamId}/slots/edit/${selectedSlotId}`, payload);
        toast.success('Slot updated');
      }
      setSlotModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(`Failed to ${slotModalMode} slot`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;

  if (myTeams.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-card border border-border rounded-xl p-8 max-w-2xl mx-auto">
          <EmptyState 
            icon={<UserGroupIcon className="w-12 h-12 text-text-muted" />}
            title="You are not leading any teams yet"
            description="Create a team to start recruiting members and managing applications."
            action={{ label: 'Create Team', onClick: () => window.location.href = '/teams/create' }}
          />
        </div>
      </div>
    );
  }

  const activeTeam = myTeams.find(t => t._id === activeTeamId);
  const activeTeamRequests = incomingRequests.filter(req => req.team?._id === activeTeamId && req.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Leader Dashboard</h1>
        <p className="text-text-muted mt-2">Manage your teams and incoming requests</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-8 overflow-x-auto">
        <nav className="flex space-x-8 min-w-max px-1">
          {myTeams.map(team => (
            <button
              key={team._id}
              onClick={() => setActiveTeamId(team._id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTeamId === team._id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
              }`}
            >
              {team.teamName || team.name}
            </button>
          ))}
        </nav>
      </div>

      {activeTeam && (
        <div className="space-y-8">
          {/* Team Overview Row */}
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary">{activeTeam.teamName || activeTeam.name}</h2>
              <p className="text-sm text-text-muted mt-1">{activeTeam.hackathon?.name || 'No hackathon linked'}</p>
              <p className="text-sm text-text-primary mt-2">
                <span className="text-text-muted">Members:</span> {activeTeam.members?.length || 0} / {(activeTeam.members?.length || 0) + (activeTeam.openSlots?.length || 0)}
              </p>
            </div>
            <Link to={`/teams/${activeTeam._id}`} className="bg-input hover:bg-input/80 border border-border text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              View Team
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pending Requests Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center justify-between">
                Pending Requests
                <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">{activeTeamRequests.length}</span>
              </h3>

              {activeTeamRequests.length > 0 ? (
                <div className="space-y-4">
                  {activeTeamRequests.map(req => (
                    <div key={req._id} className="bg-input/50 border border-border rounded-lg p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-input flex items-center justify-center font-bold text-text-primary">
                            {req.user?.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">{req.user?.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded border border-primary/30 uppercase tracking-wide">
                                {req.user?.tier || 'Newbie'}
                              </span>
                              <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded border border-warning/30 flex items-center gap-1">
                                ⭐ {req.user?.score?.totalScore || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-text-muted">
                          {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-text-primary mb-2">
                          Applied for: <span className="bg-card border border-border px-2 py-0.5 rounded text-xs ml-1">{req.appliedRole}</span>
                        </p>
                        {req.message && (
                          <div className="bg-card border-l-2 border-primary p-3 rounded-r-lg">
                            <p className="text-sm text-text-muted italic">"{req.message}"</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                        <Link to={`/chat/request/${req._id}`} className="flex-1 min-w-[80px] text-center px-3 py-1.5 border border-primary text-primary hover:bg-primary/10 rounded-lg text-sm font-medium transition-colors">
                          Chat
                        </Link>
                        <button onClick={() => handleAccept(req._id)} disabled={actionLoading} className="flex-1 min-w-[80px] flex items-center justify-center gap-1 px-3 py-1.5 bg-success text-white hover:bg-success/90 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                          <CheckCircleIcon className="w-4 h-4" /> Accept
                        </button>
                        <button onClick={() => openRejectModal(req._id)} disabled={actionLoading} className="flex-1 min-w-[80px] flex items-center justify-center gap-1 px-3 py-1.5 bg-danger text-white hover:bg-danger/90 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                          <XCircleIcon className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-text-muted">No pending requests for this team</p>
                </div>
              )}
            </div>

            {/* Slot Management Section */}
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
              <h3 className="text-lg font-semibold text-text-primary mb-6">Team Slots</h3>
              
              <div className="space-y-4 flex-1">
                {activeTeam.openSlots?.map(slot => (
                  <div key={slot._id || slot.role} className="bg-input/50 border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-text-primary">{slot.role}</h4>
                        <p className="text-xs text-text-muted mt-1 flex items-center gap-2">
                          Min Score: <span className="font-medium text-warning">{slot.minScore || 0}</span>
                        </p>
                      </div>
                      {slot.isFilled ? (
                        <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded border border-success/30 font-bold uppercase tracking-wider">Filled</span>
                      ) : (
                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded border border-primary/30 font-bold uppercase tracking-wider">Open</span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {slot.requiredSkills?.map((skill, sIdx) => (
                        <span key={sIdx} className="text-[10px] bg-card border border-border px-1.5 py-0.5 rounded text-text-muted">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-border">
                      <div className="text-xs text-text-muted">
                        {slot.isFilled ? (
                          <span>Filled by: <span className="font-medium text-text-primary">{slot.filledBy?.name || 'Member'}</span></span>
                        ) : (
                          <span>Requests: <span className="bg-input px-1.5 py-0.5 rounded">{incomingRequests.filter(r => r.team?._id === activeTeam._id && r.appliedRole === slot.role && r.status === 'pending').length}</span></span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEditSlot(slot)} className="p-1.5 text-text-muted hover:text-primary hover:bg-input rounded transition-colors" title="Edit">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        {!slot.isFilled && (
                          <button onClick={() => handleRemoveSlot(activeTeam._id, slot._id)} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors" title="Remove">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={openAddSlot} className="w-full mt-6 py-2.5 border-2 border-dashed border-border text-text-muted hover:text-primary hover:border-primary/50 hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm">
                <PlusIcon className="w-4 h-4" /> Add Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Request">
        <form onSubmit={handleReject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Reason for Rejection <span className="text-danger">*</span></label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. We are looking for someone with more React experience."
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setRejectModalOpen(false)} className="px-4 py-2 rounded-lg text-text-muted hover:bg-input transition-colors font-medium text-sm">
              Cancel
            </button>
            <button type="submit" disabled={actionLoading} className="px-4 py-2 rounded-lg bg-danger text-white hover:bg-danger/90 transition-colors font-medium text-sm disabled:opacity-50">
              Confirm Reject
            </button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Slot Modal */}
      <Modal isOpen={slotModalOpen} onClose={() => setSlotModalOpen(false)} title={slotModalMode === 'add' ? 'Add New Slot' : 'Edit Slot'}>
        <form onSubmit={handleSlotSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Role Name</label>
            <input
              type="text"
              required
              value={slotForm.role}
              onChange={e => setSlotForm({...slotForm, role: e.target.value})}
              placeholder="e.g. Backend Developer"
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
              disabled={slotModalMode === 'edit'} // Usually shouldn't change role name to avoid messing up active requests
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Min Score</label>
            <input
              type="number"
              min="0"
              value={slotForm.minScore}
              onChange={e => setSlotForm({...slotForm, minScore: e.target.value})}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Required Skills</label>
            <div className="bg-input border border-border rounded-lg p-2 min-h-[42px] flex flex-wrap gap-2 items-center focus-within:border-primary transition-colors">
              {slotForm.requiredSkills.map((skill, idx) => (
                <span key={idx} className="bg-card border border-border px-2 py-1 rounded text-xs text-text-primary flex items-center gap-1">
                  {skill}
                  <button type="button" onClick={() => removeSkill(idx)} className="hover:text-danger">
                    <XCircleIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={slotForm.skillInput}
                onChange={e => setSlotForm({...slotForm, skillInput: e.target.value})}
                onKeyDown={handleSkillKeyDown}
                placeholder="Type skill & press Enter"
                className="flex-1 bg-transparent border-none text-sm text-text-primary focus:outline-none min-w-[140px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setSlotModalOpen(false)} className="px-4 py-2 rounded-lg text-text-muted hover:bg-input transition-colors font-medium text-sm">
              Cancel
            </button>
            <button type="submit" disabled={actionLoading} className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium text-sm disabled:opacity-50">
              {slotModalMode === 'add' ? 'Add Slot' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaderDashboard;
