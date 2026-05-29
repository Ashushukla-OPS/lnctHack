import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import CountdownTimer from '../../components/CountdownTimer';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  MagnifyingGlassIcon, 
  PlusIcon,
  CalendarIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const HackathonList = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    organizer: '',
    startDate: '',
    endDate: '',
    submissionDeadline: '',
    mode: 'Online',
    location: '',
    maxTeamSize: 4
  });

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/hackathon');
      const hackathonList = res.data?.hackathons || res.data?.data || [];
      setHackathons(Array.isArray(hackathonList) ? hackathonList : []);
    } catch (error) {
      toast.error('Failed to load hackathons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.organizer.trim() || !formData.startDate || !formData.endDate) {
      return toast.error('Please fill required fields');
    }
    
    try {
      setActionLoading(true);
      await axios.post('/hackathon/create', formData);
      toast.success('Hackathon created!');
      setIsModalOpen(false);
      fetchHackathons();
      setFormData({ name: '', organizer: '', startDate: '', endDate: '', submissionDeadline: '', mode: 'Online', location: '', maxTeamSize: 4 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create hackathon');
    } finally {
      setActionLoading(false);
    }
  };

  const getModeBadge = (mode) => {
    const m = mode?.toLowerCase();
    if (m === 'online') return 'bg-primary/20 text-primary border-primary/30';
    if (m === 'offline') return 'bg-success/20 text-success border-success/30';
    return 'bg-accent/20 text-accent border-accent/30'; // hybrid
  };

  const getHackathonStatus = (h) => {
    const now = new Date();
    const start = new Date(h.startDate);
    const end = new Date(h.endDate);
    if (now < start) return 'Upcoming';
    if (now > end) return 'Ended';
    return 'Ongoing';
  };

  const filteredHackathons = hackathons.filter(h => {
    const matchesSearch = h.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode = modeFilter === 'All' || h.mode?.toLowerCase() === modeFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || getHackathonStatus(h) === statusFilter;
    return matchesSearch && matchesMode && matchesStatus;
  });

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Hackathons</h1>
          <p className="text-text-muted mt-2">Discover and join upcoming hackathons</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-transparent border border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors font-medium flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" /> Create Hackathon
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search hackathons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none"
          >
            <option value="All">All Modes</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Hybrid">Hybrid</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none"
          >
            <option value="All">All Statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Ended">Ended</option>
          </select>
        </div>
      </div>

      {/* Hackathons Grid */}
      {filteredHackathons.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredHackathons.map(h => {
            const status = getHackathonStatus(h);
            return (
              <div key={h._id} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-full hover:border-primary/40 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">{h.name}</h2>
                    <p className="text-sm text-text-muted mt-1">by {h.organizer}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${getModeBadge(h.mode)}`}>
                    {h.mode || 'Online'}
                  </span>
                </div>

                {h.mode !== 'Online' && h.location && (
                  <p className="text-sm text-text-muted mb-4 flex items-center gap-1.5">
                    📍 {h.location}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-input/50 border border-border rounded-lg p-3 text-center">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Max Team</p>
                    <p className="font-semibold text-text-primary">{h.maxTeamSize} members</p>
                  </div>
                  <div className="bg-input/50 border border-border rounded-lg p-3 text-center">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Registered</p>
                    <p className="font-semibold text-text-primary">{h.registeredTeams?.length || 0} teams</p>
                  </div>
                </div>

                <div className="mb-6 flex-1 flex flex-col justify-center items-center py-4 bg-input/20 border border-border/50 rounded-lg">
                   {status === 'Upcoming' ? (
                     <>
                       <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Starts In</p>
                       <CountdownTimer targetDate={h.startDate} />
                     </>
                   ) : status === 'Ongoing' ? (
                     <>
                       <p className="text-xs text-success font-bold uppercase tracking-wider mb-2">● LIVE NOW</p>
                       <span className="text-sm text-text-muted">Ends {format(new Date(h.endDate), 'MMM d')}</span>
                     </>
                   ) : (
                     <span className="text-sm font-medium text-text-muted">Hackathon Ended</span>
                   )}
                </div>

                <div className="flex items-center justify-between text-xs text-text-muted mb-4 border-t border-border pt-4">
                  <div className="flex items-center gap-1"><CalendarIcon className="w-4 h-4"/> Start: {format(new Date(h.startDate), 'MMM d, yyyy')}</div>
                  <div className="flex items-center gap-1"><TrophyIcon className="w-4 h-4"/> End: {format(new Date(h.endDate), 'MMM d, yyyy')}</div>
                </div>

                <Link to={`/hackathons/${h._id}`} className="w-full py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 rounded-lg font-medium text-sm transition-colors text-center mt-auto">
                  View Details
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12">
          <EmptyState 
            icon={<TrophyIcon className="w-16 h-16 text-border" />}
            title="No hackathons found"
            description="Try adjusting your filters or search term."
            action={{ label: 'Clear Filters', onClick: () => { setSearchTerm(''); setModeFilter('All'); setStatusFilter('All'); } }}
          />
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Hackathon">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Hackathon Name <span className="text-danger">*</span></label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Organizer <span className="text-danger">*</span></label>
            <input type="text" required value={formData.organizer} onChange={e => setFormData({...formData, organizer: e.target.value})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Start Date/Time <span className="text-danger">*</span></label>
              <input type="datetime-local" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">End Date/Time <span className="text-danger">*</span></label>
              <input type="datetime-local" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Submission Deadline</label>
            <input type="datetime-local" value={formData.submissionDeadline} onChange={e => setFormData({...formData, submissionDeadline: e.target.value})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Mode</label>
              <select value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary">
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Max Team Size</label>
              <input type="number" min="1" value={formData.maxTeamSize} onChange={e => setFormData({...formData, maxTeamSize: Number(e.target.value)})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
            </div>
          </div>
          {formData.mode !== 'Online' && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Location</label>
              <input type="text" required={formData.mode !== 'Online'} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary" placeholder="City, Venue, etc." />
            </div>
          )}
          
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-text-muted hover:bg-input font-medium text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={actionLoading} className="px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
              Create Hackathon
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default HackathonList;
