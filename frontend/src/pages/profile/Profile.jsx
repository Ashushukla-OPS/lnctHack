import { useAuth } from '../../context/AuthContext';
import BuilderPassportCard from '../../components/BuilderPassportCard';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <BuilderPassportCard user={user} />
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Account Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Name</label>
                <div className="w-full bg-input border border-border rounded-lg px-4 py-2 text-text-primary">
                  {user?.name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
                <div className="w-full bg-input border border-border rounded-lg px-4 py-2 text-text-primary">
                  {user?.email}
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-border flex justify-end gap-4">
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
