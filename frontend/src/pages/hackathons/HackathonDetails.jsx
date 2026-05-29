import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../../utils/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import CountdownTimer from '../../components/CountdownTimer';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';
import { 
  ArrowLeftIcon,
  MapPinIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

const HackathonDetails = () => {
  const { id } = useParams();
  const [hackathon, setHackathon] = useState(null);
  const [timerData, setTimerData] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // We can track if user is registered by seeing if any team they are in is in this hackathon
  // For simplicity, we just look at the teams list if it includes a team led by the current user
  // Or we use a generic "Register" state if API was provided
  
  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hRes, timerRes, teamsRes] = await Promise.all([
        axios.get(`/hackathon/${id}`),
        axios.get(`/hackathon/${id}/timer`).catch(() => ({ data: null })), // might not exist
        axios.get(`/teams`)
      ]);
      
      const hData = hRes.data?.hackathon || hRes.data?.data || hRes.data;
      setHackathon(hData);
      
      if (timerRes.data) {
        setTimerData(timerRes.data?.data || timerRes.data);
      }

      const allTeams = teamsRes.data?.teams || teamsRes.data?.data || [];
      // Filter teams that belong to this hackathon
      const hTeams = Array.isArray(allTeams) ? allTeams.filter(t => t.hackathon?._id === id || t.hackathon === id) : [];
      setTeams(hTeams);

    } catch (error) {
      toast.error('Failed to load hackathon details');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (h) => {
    const now = new Date();
    const start = new Date(h.startDate);
    const end = new Date(h.endDate);
    if (now < start) return 'Upcoming';
    if (now > end) return 'Ended';
    return 'Ongoing';
  };

  const getModeColor = (mode) => {
    const m = mode?.toLowerCase();
    if (m === 'online') return 'bg-primary/20 text-primary border-primary/30';
    if (m === 'offline') return 'bg-success/20 text-success border-success/30';
    return 'bg-accent/20 text-accent border-accent/30'; 
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  if (!hackathon) return null;

  const status = getStatus(hackathon);
  const durationDays = differenceInDays(new Date(hackathon.endDate), new Date(hackathon.startDate)) || 1;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/hackathons" className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors mb-6">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Hackathons
      </Link>

      {/* Hero Section */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <CalendarDaysIcon className="w-48 h-48 text-primary" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getModeColor(hackathon.mode)}`}>
              {hackathon.mode || 'Online'}
            </span>
            {hackathon.location && hackathon.mode !== 'Online' && (
              <span className="flex items-center gap-1 text-sm font-medium text-text-muted bg-input px-3 py-1 rounded-full">
                <MapPinIcon className="w-4 h-4" /> {hackathon.location}
              </span>
            )}
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
              status === 'Ongoing' ? 'bg-success/20 text-success border-success/30 animate-pulse' :
              status === 'Ended' ? 'bg-input text-text-muted border-border' :
              'bg-warning/20 text-warning border-warning/30'
            }`}>
              {status}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-text-primary mb-2 leading-tight">
            {hackathon.name}
          </h1>
          <p className="text-lg text-text-muted mb-8">Organized by <span className="font-semibold text-text-primary">{hackathon.organizer}</span></p>

          <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm mb-8 bg-main/50 inline-flex p-4 rounded-xl border border-border/50 backdrop-blur-sm">
            <div>
              <p className="text-text-muted uppercase tracking-wider text-[10px] font-bold mb-1">Start Date</p>
              <p className="font-semibold text-text-primary">{format(new Date(hackathon.startDate), 'MMM do, yyyy • h:mm a')}</p>
            </div>
            <div>
              <p className="text-text-muted uppercase tracking-wider text-[10px] font-bold mb-1">End Date</p>
              <p className="font-semibold text-text-primary">{format(new Date(hackathon.endDate), 'MMM do, yyyy • h:mm a')}</p>
            </div>
            {hackathon.submissionDeadline && (
              <div>
                <p className="text-danger uppercase tracking-wider text-[10px] font-bold mb-1">Submission Deadline</p>
                <p className="font-semibold text-text-primary">{format(new Date(hackathon.submissionDeadline), 'MMM do, yyyy • h:mm a')}</p>
              </div>
            )}
          </div>
          
          <div>
            <button className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98]">
              Register for Hackathon
            </button>
            <p className="text-xs text-text-muted mt-3">Register your team to participate and access AI validation tools.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Large Timer */}
        <div className="md:col-span-2 bg-card border border-border rounded-2xl p-8 flex flex-col justify-center items-center text-center shadow-sm">
           <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-6">
             {status === 'Upcoming' ? 'Hackathon Begins In' : status === 'Ongoing' ? 'Time Remaining' : 'Event Concluded'}
           </h3>
           <div className="scale-125 md:scale-150 transform origin-center">
             {status !== 'Ended' ? (
               <CountdownTimer targetDate={status === 'Upcoming' ? hackathon.startDate : hackathon.endDate} />
             ) : (
               <span className="text-3xl font-black text-text-muted font-mono tracking-widest">00:00:00:00</span>
             )}
           </div>
        </div>

        {/* Stats */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="bg-input/50 border border-border rounded-xl p-4 text-center flex-1 flex flex-col justify-center">
            <span className="text-3xl font-black text-primary mb-1">{teams.length}</span>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Registered Teams</span>
          </div>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="bg-input/50 border border-border rounded-xl p-4 text-center flex flex-col justify-center">
              <span className="text-xl font-black text-text-primary mb-1">{hackathon.maxTeamSize}</span>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider leading-tight">Max Size</span>
            </div>
            <div className="bg-input/50 border border-border rounded-xl p-4 text-center flex flex-col justify-center">
              <span className="text-xl font-black text-text-primary mb-1">{durationDays}</span>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider leading-tight">Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Teams List */}
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <UserGroupIcon className="w-6 h-6 text-primary" /> Teams Participating
        </h2>
        
        {teams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map(team => (
              <div key={team._id} className="bg-main border border-border hover:border-primary/50 transition-colors rounded-xl p-5 flex flex-col h-full">
                <h3 className="font-bold text-text-primary text-lg mb-4">{team.teamName || team.name}</h3>
                <div className="flex justify-between items-center text-sm text-text-muted mb-4 mt-auto">
                  <span className="flex items-center gap-1.5"><UserGroupIcon className="w-4 h-4"/> {team.members?.length || 0} Members</span>
                  <span className="font-medium text-warning bg-warning/10 px-2 py-0.5 rounded">{team.openSlots?.filter(s => !(s.filled || s.isFilled)).length || 0} Open Slots</span>
                </div>
                <Link to={`/teams/${team._id}`} className="w-full text-center py-2 bg-input hover:bg-primary hover:text-white border border-border rounded-lg text-sm font-medium transition-colors">
                  View Team
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={<UserGroupIcon className="w-12 h-12 text-border" />}
            title="No teams registered yet"
            description="Be the first to create and register a team for this hackathon!"
          />
        )}
      </div>
    </div>
  );
};

export default HackathonDetails;
