import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import TeamCard from '../../components/TeamCard';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Find Your Team</h1>
          <p className="text-text-muted mt-2">Discover verified teams looking for talent</p>
        </div>
        <Link 
          to="/teams/create" 
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <PlusIcon className="w-5 h-5" />
          Create Team
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-4 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          
          <div className="relative">
            <select
              value={selectedHackathon}
              onChange={(e) => setSelectedHackathon(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none"
            >
              <option value="">All Hackathons</option>
              {hackathons.map(h => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none"
            >
              <option value="">All Roles</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="fullstack">Full Stack</option>
              <option value="design">Design</option>
              <option value="ai">AI/ML</option>
            </select>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Location or 'Remote'"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
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
        <div className="bg-card border border-border rounded-xl p-8">
          <EmptyState 
            icon={<UserGroupIcon className="w-12 h-12 text-text-muted" />}
            title="No teams match your search"
            description="Try adjusting your filters to find more teams."
            action={{ label: 'Clear Filters', onClick: clearFilters }}
          />
        </div>
      )}

      {/* Interest Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Express Interest">
        {selectedTeam && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-muted mb-1">Applying to Team</p>
              <p className="font-semibold text-text-primary">{selectedTeam.teamName || selectedTeam.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Select Role</label>
              <select
                value={applyRole}
                onChange={(e) => setApplyRole(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
              >
                {selectedTeam.openSlots?.map((slot, idx) => (
                  <option key={idx} value={slot.role}>{slot.role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Message (Optional)</label>
              <textarea
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                maxLength={300}
                rows={4}
                placeholder="Why are you a good fit?"
                className="w-full bg-input border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors resize-none"
              ></textarea>
              <p className="text-xs text-text-muted text-right mt-1">{applyMessage.length}/300</p>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-text-muted hover:bg-input transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={submitInterest}
                disabled={submittingInterest}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {submittingInterest ? 'Sending...' : 'Submit Interest'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TeamDiscovery;
