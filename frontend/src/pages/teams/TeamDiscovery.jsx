import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import TeamCard from '../../components/TeamCard';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';

const TeamDiscovery = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [applyRole, setApplyRole] = useState('');
  const [applyMessage, setApplyMessage] = useState('');
  const [submittingInterest, setSubmittingInterest] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [teamsRes, hackathonsRes, requestsRes] = await Promise.all([
          axios.get('/teams'),
          axios.get('/hackathon'),
          axios.get('/join-request/my-requests')
        ]);
        
        setTeams(teamsRes.data?.teams || teamsRes.data?.data || teamsRes.data || []);
        setHackathons(hackathonsRes.data?.hackathons || hackathonsRes.data?.data || hackathonsRes.data || []);
        setMyRequests(requestsRes.data?.data || requestsRes.data || []);
      } catch (error) {
        toast.error('Failed to load teams data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInterestClick = (team) => {
    setSelectedTeam(team);
    setApplyRole(team.openSlots?.[0]?.role || '');
    setApplyMessage('');
    setIsModalOpen(true);
  };

  const submitInterest = async () => {
    if (!applyRole) {
      toast.error('Please select a role');
      return;
    }
    
    try {
      setSubmittingInterest(true);
      await axios.post('/join-request/send', {
        teamId: selectedTeam._id,
        appliedRole: applyRole,
        message: applyMessage
      });
      
      toast.success('Interest sent successfully!');
      setMyRequests(prev => [...prev, { team: selectedTeam._id, status: 'pending' }]);
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send interest');
    } finally {
      setSubmittingInterest(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedHackathon('');
    setSelectedRole('');
    setLocationFilter('');
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = (team.teamName || team.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesHackathon = selectedHackathon ? team.hackathon?._id === selectedHackathon : true;
    const matchesLocation = locationFilter ? 
      (team.isRemote ? 'remote' : team.location?.toLowerCase() || '').includes(locationFilter.toLowerCase()) 
      : true;
    
    const matchesRole = selectedRole ? team.openSlots?.some(slot => slot.role?.toLowerCase().includes(selectedRole.toLowerCase())) : true;

    return matchesSearch && matchesHackathon && matchesLocation && matchesRole;
  });

  const checkIsApplied = (teamId) => {
    return myRequests.some(req => 
      (typeof req.team === 'object' ? req.team._id === teamId : req.team === teamId) && 
      ['pending', 'accepted'].includes(req.status)
    );
  };

  const checkIsMember = (team) => {
    return team.leader?._id === user?._id || team.members?.some(m => m._id === user?._id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in font-sans relative overflow-hidden">
      
      {/* Visual neon backdrops */}
      <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#232329] pb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            Find Your Hackathon Team
          </h1>
          <p className="text-sm text-text-muted mt-1 font-medium">
            Discover active builder squads seeking specific engineering specialties and roles.
          </p>
        </div>
        <Link 
          to="/teams/create" 
          className="btn-primary text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-violet-500/10 flex items-center justify-center gap-1.5 shrink-0"
        >
          <span>➕</span>
          <span>Create Team</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="glass-card bg-[#141417]/85 border border-[#232329] p-5 backdrop-blur-md shadow-lg rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Search Input */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm select-none">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by team name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#16161a] border border-[#232329] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-text-muted/40 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 font-medium transition-all"
            />
          </div>
          
          {/* Hackathon Filter */}
          <div className="relative">
            <select
              value={selectedHackathon}
              onChange={(e) => setSelectedHackathon(e.target.value)}
              className="w-full bg-[#16161a] border border-[#232329] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 font-medium transition-all appearance-none cursor-pointer"
            >
              <option value="">All Hackathons</option>
              {hackathons.map(h => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
          </div>

          {/* Specialty Role Filter */}
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-[#16161a] border border-[#232329] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 font-medium transition-all appearance-none cursor-pointer"
            >
              <option value="">All Specialties</option>
              <option value="frontend">Frontend Experts</option>
              <option value="backend">Backend Architects</option>
              <option value="fullstack">Full Stack Engineers</option>
              <option value="design">UI/UX Designers</option>
              <option value="ai">AI / ML Coders</option>
            </select>
          </div>

          {/* Location Filter */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm select-none">
              📍
            </span>
            <input
              type="text"
              placeholder="Location or 'Remote'"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full bg-[#16161a] border border-[#232329] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-text-muted/40 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 font-medium transition-all"
            />
          </div>

        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64 bg-[#0c0c0e]">
          <LoadingSpinner />
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <TeamCard 
              key={team._id} 
              team={team} 
              isApplied={checkIsApplied(team._id)}
              isMember={checkIsMember(team)}
              onInterest={handleInterestClick}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card bg-[#141417]/85 border border-[#232329] p-12 text-center rounded-2xl shadow-sm">
          <EmptyState 
            icon={<span className="text-4xl block mb-2 select-none">👥</span>}
            title="No squads match your filters"
            description="Try broadening your search terms or clearing role filters."
            action={{ label: 'Clear All Filters', onClick: clearFilters }}
          />
        </div>
      )}

      {/* Interest Submission Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Express Collaboration Interest">
        {selectedTeam && (
          <div className="space-y-5 font-sans">
            <div>
              <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Selected Squad</p>
              <p className="font-bold text-lg text-white tracking-tight">{selectedTeam.teamName || selectedTeam.name}</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">Choose Desired Role</label>
              <select
                value={applyRole}
                onChange={(e) => setApplyRole(e.target.value)}
                className="w-full bg-[#16161a] border border-[#232329] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-all font-medium appearance-none cursor-pointer"
              >
                {selectedTeam.openSlots?.map((slot, idx) => (
                  <option key={idx} value={slot.role}>{slot.role}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">Cover Note / Message (Optional)</label>
              <textarea
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                maxLength={300}
                rows={4}
                placeholder="Briefly state your competencies and why you are a good fit for this squad..."
                className="w-full bg-[#16161a] border border-[#232329] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-all font-medium resize-none"
              ></textarea>
              <p className="text-[10px] text-text-muted text-right mt-1 font-bold">{applyMessage.length}/300 chars</p>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-[#232329]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary px-5 py-2 text-xs rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={submitInterest}
                disabled={submittingInterest}
                className="btn-primary px-5 py-2 text-xs rounded-xl font-bold shadow-md shadow-violet-500/10"
              >
                {submittingInterest ? 'Submitting...' : 'Submit Interest 🚀'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TeamDiscovery;
