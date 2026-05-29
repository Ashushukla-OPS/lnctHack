import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../utils/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import BuilderPassportCard from '../../components/BuilderPassportCard';
import toast from 'react-hot-toast';
import { 
  ClipboardDocumentCheckIcon,
  StarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const PublicProfile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/users/${username}`);
        setProfile(res.data?.user || res.data?.data || res.data);
      } catch (err) {
        setError(true);
        toast.error('Profile not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [username]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied!');
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  if (error || !profile) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-input rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">🕵️</span>
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Profile not found</h1>
      <p className="text-text-muted">The user you are looking for does not exist or has been deleted.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Profile Header Row */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 mb-12 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="w-24 h-24 rounded-full object-cover border-4 border-card shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/20 text-primary border-4 border-card shadow-lg flex items-center justify-center text-4xl font-black">
              {profile.name?.charAt(0) || 'U'}
            </div>
          )}
          
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center justify-center md:justify-start gap-3">
              {profile.name}
              <span className="text-xs font-bold uppercase tracking-wider bg-primary text-white px-2 py-1 rounded-md align-middle">
                {profile.tier || 'Newbie'}
              </span>
            </h1>
            <p className="text-text-muted text-sm max-w-md mx-auto md:mx-0">
              {profile.bio || 'This builder prefers to let their code do the talking.'}
            </p>
          </div>
        </div>

        <button 
          onClick={copyLink}
          className="shrink-0 flex items-center gap-2 bg-input hover:bg-input/80 border border-border text-text-primary px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <ClipboardDocumentCheckIcon className="w-4 h-4" /> Copy Profile Link
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left Col - Passport */}
        <div className="md:col-span-3">
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <StarIcon className="w-6 h-6 text-warning" /> Builder Passport
          </h2>
          {/* BuilderPassportCard is reusable and read-only by design */}
          <BuilderPassportCard user={profile} />
        </div>

        {/* Right Col - Rep & Stats */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Reputation</h3>
            <div className="text-center py-4 bg-input/50 border border-border rounded-lg mb-4">
              <span className="text-5xl font-black text-primary">{profile.score?.totalScore || 0}</span>
              <p className="text-xs text-text-muted uppercase tracking-wider mt-2 font-semibold">Total Verified Score</p>
            </div>
            
            {profile.isBlacklisted && (
              <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 flex items-start gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-danger mb-1">Account Restricted</h4>
                  <p className="text-xs text-danger/80 leading-relaxed">This user has violated platform policies. Proceed with caution.</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
             <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Platform Stats</h3>
             <div className="space-y-4">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-text-muted">Teams Joined</span>
                 <span className="font-bold text-text-primary">{profile.teamsJoined || 0}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-text-muted">Hackathons Won</span>
                 <span className="font-bold text-text-primary">{profile.hackathonsWon || 0}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-text-muted">Member Since</span>
                 <span className="font-medium text-text-primary">
                   {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                 </span>
               </div>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PublicProfile;
