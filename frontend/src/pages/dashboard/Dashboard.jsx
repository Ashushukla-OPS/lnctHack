import { useAuth } from '../../context/AuthContext';
import BuilderPassportCard from '../../components/BuilderPassportCard';
import EmptyState from '../../components/EmptyState';
import { BriefcaseIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <BuilderPassportCard user={user} />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <UserGroupIcon className="w-6 h-6 text-primary" />
              My Teams
            </h2>
            <EmptyState 
              icon={<UserGroupIcon className="w-12 h-12 text-text-muted" />}
              title="No teams yet"
              description="You haven't joined or created any teams."
              action={{ label: 'Find a Team', onClick: () => {} }}
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <BriefcaseIcon className="w-6 h-6 text-primary" />
              Active Hackathons
            </h2>
            <EmptyState 
              icon={<BriefcaseIcon className="w-12 h-12 text-text-muted" />}
              title="No active hackathons"
              description="You are not participating in any hackathons currently."
              action={{ label: 'Browse Hackathons', onClick: () => {} }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
