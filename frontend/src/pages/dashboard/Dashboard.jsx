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

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <BuilderPassportCard user={user} />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          {/* My Teams */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <UserGroupIcon className="w-6 h-6 text-primary" />
              My Teams
            </h2>
            {teams.length > 0 ? (
              <div className="space-y-4">
                {teams.map(team => (
                  <div key={team._id} className="flex justify-between items-center p-4 bg-input/50 border border-border rounded-lg shadow-sm hover:border-primary/30 transition-colors">
                    <div>
                      <h3 className="font-semibold text-text-primary">{team.teamName || team.name}</h3>
                      <p className="text-xs text-text-muted mt-1">{team.hackathon?.name || 'No hackathon linked'}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/teams/${team._id}`)}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Workspace
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={<UserGroupIcon className="w-12 h-12 text-text-muted" />}
                title="No teams yet"
                description="You haven't joined or created any teams."
                action={{ label: 'Find a Team', onClick: () => navigate('/teams') }}
              />
            )}
          </div>

          {/* Active Hackathons */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <BriefcaseIcon className="w-6 h-6 text-primary" />
              Active Hackathons
            </h2>
            {hackathons.length > 0 ? (
              <div className="space-y-4">
                {hackathons.map(hackathon => (
                  <div key={hackathon._id} className="flex justify-between items-center p-4 bg-input/50 border border-border rounded-lg shadow-sm hover:border-primary/30 transition-colors">
                    <div>
                      <h3 className="font-semibold text-text-primary">{hackathon.name}</h3>
                      <p className="text-xs text-text-muted mt-1">Organizer: {hackathon.organizer} • Mode: {hackathon.mode}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/hackathons/${hackathon._id}`)}
                      className="px-3 py-1.5 bg-input border border-border text-text-primary hover:bg-input/80 rounded-lg text-xs font-semibold transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={<BriefcaseIcon className="w-12 h-12 text-text-muted" />}
                title="No active hackathons"
                description="You are not participating in any hackathons currently."
                action={{ label: 'Browse Hackathons', onClick: () => navigate('/hackathons') }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
