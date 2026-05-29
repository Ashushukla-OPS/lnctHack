import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BuilderPassportCard from '../../components/BuilderPassportCard';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import axios from '../../utils/axios';
import { BriefcaseIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [teamsRes, hackathonsRes] = await Promise.all([
          axios.get('/teams'),
          axios.get('/hackathon')
        ]);

        const allTeams = teamsRes.data?.teams || teamsRes.data?.data || teamsRes.data || [];
        const allHackathons = hackathonsRes.data?.hackathons || hackathonsRes.data?.data || hackathonsRes.data || [];

        // Filter user's joined/created teams
        const userTeams = allTeams.filter(t => 
          t.leader?._id === user?._id || 
          t.leader === user?._id || 
          t.members?.some(m => m.userId?._id === user?._id || m.userId === user?._id)
        );
        setTeams(userTeams);

        // Filter hackathons user is registered in
        const userHackathons = allHackathons.filter(h => 
          h.registeredStudents?.some(id => id === user?._id) ||
          userTeams.some(t => t.hackathon?._id === h._id || t.hackathon === h._id)
        );
        setHackathons(userHackathons);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0c0c0e]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in font-sans">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-violet-600/10 relative overflow-hidden select-none">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 rounded-l-full blur-2xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            Welcome back, {user?.name}! ⚡
          </h1>
          <p className="text-violet-100 text-sm font-medium max-w-xl">
            Match with expert developers, discover upcoming hackathons, and form high-performance squads using AI.
          </p>
        </div>
        <div className="shrink-0 z-10">
          <button 
            onClick={() => navigate('/teams')} 
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white text-violet-700 hover:bg-violet-50 font-bold text-sm shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Find Teammates ➜
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Passport Card */}
        <div className="lg:col-span-1">
          <div className="glass-card overflow-hidden">
            <BuilderPassportCard user={user} />
          </div>
        </div>
        
        {/* Right Column: Teams and Hackathons */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* My Teams */}
          <div className="glass-card p-6 border border-[#232329] bg-[#141417]/85 backdrop-blur-md shadow-lg rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-[#232329] pb-3">
              <UserGroupIcon className="w-5 h-5 text-violet-400" />
              My Teams ({teams.length})
            </h2>
            {teams.length > 0 ? (
              <div className="space-y-3.5">
                {teams.map(team => (
                  <div 
                    key={team._id} 
                    className="flex justify-between items-center p-4 bg-[#18181c]/50 border border-[#232329] rounded-xl hover:border-violet-500/30 transition-all duration-300"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-white">{team.teamName || team.name}</h3>
                      <p className="text-xs text-text-muted mt-0.5">{team.hackathon?.name || 'No hackathon linked'}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/teams/${team._id}`)}
                      className="btn-primary text-xs py-1.5 px-3 rounded-lg shadow-sm"
                    >
                      Workspace
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6">
                <EmptyState 
                  icon={<UserGroupIcon className="w-12 h-12 text-text-muted" />}
                  title="No teams yet"
                  description="You haven't joined or created any teams."
                  action={{ label: 'Find a Team', onClick: () => navigate('/teams') }}
                />
              </div>
            )}
          </div>

          {/* Active Hackathons */}
          <div className="glass-card p-6 border border-[#232329] bg-[#141417]/85 backdrop-blur-md shadow-lg rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-[#232329] pb-3">
              <BriefcaseIcon className="w-5 h-5 text-violet-400" />
              Active Hackathons ({hackathons.length})
            </h2>
            {hackathons.length > 0 ? (
              <div className="space-y-3.5">
                {hackathons.map(hackathon => (
                  <div 
                    key={hackathon._id} 
                    className="flex justify-between items-center p-4 bg-[#18181c]/50 border border-[#232329] rounded-xl hover:border-violet-500/30 transition-all duration-300"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-white">{hackathon.name}</h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        Organizer: {hackathon.organizer} • Mode: {hackathon.mode}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/hackathons/${hackathon._id}`)}
                      className="btn-secondary text-xs py-1.5 px-3 rounded-lg"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6">
                <EmptyState 
                  icon={<BriefcaseIcon className="w-12 h-12 text-text-muted" />}
                  title="No active hackathons"
                  description="You are not participating in any hackathons currently."
                  action={{ label: 'Browse Hackathons', onClick: () => navigate('/hackathons') }}
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
