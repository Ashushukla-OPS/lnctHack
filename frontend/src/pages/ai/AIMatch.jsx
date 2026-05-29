import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { 
  ArrowLeftIcon,
  SparklesIcon,
  CodeBracketIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

const AIMatch = () => {
  const { teamId } = useParams();
  const { user } = useAuth();
  
  const [team, setTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/teams/${teamId}`);
      setTeam(res.data?.data || res.data);
    } catch (error) {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatches = async () => {
    try {
      setAnalyzing(true);
      // Backend should run Gemini logic and return top matching users for open slots
      const res = await axios.get(`/ai/match/${teamId}`);
      const data = res.data?.data || res.data;
      
      // Assuming response includes { matches: [...], generatedAt: "..." }
      setMatches(data.matches || []);
      setLastGenerated(data.generatedAt || new Date().toISOString());
      
      toast.success('Analysis complete!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to analyze candidates');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleInvite = async (userId, role) => {
    try {
      await axios.post('/join-request/send', { 
        teamId, 
        appliedRole: role,
        message: 'Hello! Our AI matched your profile with our open slot. Would you be interested in joining?',
        isInvite: true // Custom flag if backend supports inviting vs applying
      });
      toast.success('Invite sent!');
    } catch (error) {
      toast.error('Failed to send invite');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  if (!team) return null;

  const isLeader = team.leader?._id === user?._id || team.leader === user?._id;

  if (!isLeader) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <ExclamationCircleIcon className="w-16 h-16 text-warning mb-4" />
        <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
        <p className="text-text-muted mb-6">Only team leaders can access the AI Teammate Finder.</p>
        <Link to={`/teams/${teamId}`} className="text-primary hover:underline">Return to Team</Link>
      </div>
    );
  }

  const openSlots = team.openSlots?.filter(s => !(s.filled || s.isFilled)) || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to={`/teams/${teamId}`} className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors mb-6">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Team
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 border-b border-border pb-8">
        <div>
          <h1 className="text-4xl font-black text-text-primary mb-2 flex items-center gap-3">
            AI Teammate Finder <SparklesIcon className="w-8 h-8 text-primary" />
          </h1>
          <p className="text-text-muted text-lg">Powered by Gemini AI • <span className="font-semibold text-text-primary">{team.teamName || team.name}</span></p>
        </div>
        
        <div className="shrink-0 flex flex-col items-end">
          {matches.length === 0 ? (
            <button
              onClick={handleFindMatches}
              disabled={analyzing || openSlots.length === 0}
              className="bg-gradient-to-r from-primary to-accent text-white px-8 py-3 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              {analyzing ? (
                <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Analyzing...</>
              ) : (
                <>Find Matching Teammates 🤖</>
              )}
            </button>
          ) : (
             <div className="flex flex-col items-end">
               <span className="text-xs text-text-muted mb-2">
                 Last generated {formatDistanceToNow(new Date(lastGenerated), { addSuffix: true })}
               </span>
               <button
                  onClick={handleFindMatches}
                  disabled={analyzing}
                  className="bg-input text-text-primary border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-input/80 transition-colors flex items-center gap-2"
                >
                  {analyzing ? <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span> : <SparklesIcon className="w-4 h-4" />}
                  Regenerate Matches
                </button>
             </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Searching For Open Slots:</h3>
        {openSlots.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {openSlots.map((slot, idx) => (
              <div key={idx} className="bg-card border border-border px-4 py-2 rounded-lg flex items-center gap-3">
                <span className="font-semibold text-text-primary">{slot.role}</span>
                <span className="w-px h-4 bg-border"></span>
                <span className="text-xs text-text-muted">Min Score: <span className="text-warning font-bold">{slot.minScore || 0}</span></span>
              </div>
            ))}
          </div>
        ) : (
           <div className="bg-success/10 border border-success/30 rounded-lg p-4 text-success flex items-center gap-2 font-medium">
             <CheckBadgeIcon className="w-5 h-5" /> All slots are filled! You don't need any more teammates.
           </div>
        )}
      </div>

      <div className="space-y-6">
        {analyzing && matches.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-sm animate-pulse">
            <SparklesIcon className="w-16 h-16 text-primary mb-6 animate-bounce" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">Gemini is analyzing candidates...</h2>
            <p className="text-text-muted max-w-md">Scanning profiles, computing skill overlap, checking availability, and analyzing past hackathon performance.</p>
          </div>
        )}

        {!analyzing && matches.length > 0 && matches.map((match, idx) => {
          const u = match;
          const candidateName = match.name || match.user?.name || "Anonymous";
          const candidateTier = match.tier || match.user?.tier || "Beginner";
          const candidateScore = match.totalScore !== undefined ? match.totalScore : (match.algorithmScore || 0);
          const fitLevel = candidateScore >= 80 ? 'Strong' : candidateScore >= 60 ? 'Good' : 'Average';
          
          const fitColorMap = {
            Strong: {
              bg: 'bg-success/20',
              text: 'text-success',
              border: 'border-success/30'
            },
            Good: {
              bg: 'bg-primary/20',
              text: 'text-primary',
              border: 'border-primary/30'
            },
            Average: {
              bg: 'bg-warning/20',
              text: 'text-warning',
              border: 'border-warning/30'
            }
          };

          const fitStyles = fitColorMap[fitLevel] || fitColorMap.Average;
          const userId = match.userId || match.user?._id;
          
          return (
            <div key={idx} className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row gap-8 relative overflow-hidden group hover:border-primary/50 transition-colors">
               {/* Left: Avatar & Basic */}
               <div className="flex flex-col items-center lg:items-start shrink-0 lg:w-48">
                 <div className="w-24 h-24 rounded-full bg-input border-4 border-main shadow-lg flex items-center justify-center text-3xl font-black text-text-primary mb-4">
                   {candidateName.charAt(0).toUpperCase()}
                 </div>
                 <h3 className="font-bold text-lg text-text-primary text-center lg:text-left leading-tight mb-1">{candidateName}</h3>
                 <span className="text-[10px] font-bold uppercase tracking-wider bg-input border border-border text-text-primary px-2 py-0.5 rounded mb-3">
                   {candidateTier}
                 </span>
                 <button onClick={() => handleInvite(userId, match.targetRole)} className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                   <UserPlusIcon className="w-4 h-4" /> Invite
                 </button>
               </div>

               {/* Center: Score & Skills */}
               <div className="flex-1 flex flex-col justify-center border-y lg:border-y-0 lg:border-x border-border py-6 lg:py-0 lg:px-8">
                 <div className="flex items-center gap-4 mb-6">
                   <div className="text-center">
                     <span className="block text-3xl font-black text-text-primary leading-none mb-1">{match.scores?.total || candidateScore}</span>
                     <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Score</span>
                   </div>
                   <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                     <div className="bg-main rounded px-2 py-1 flex justify-between items-center"><span className="text-text-muted flex items-center gap-1"><CodeBracketIcon className="w-3 h-3"/> GitHub</span> <span className="font-semibold">{match.scores?.github || 0}</span></div>
                     <div className="bg-main rounded px-2 py-1 flex justify-between items-center"><span className="text-text-muted">LeetCode</span> <span className="font-semibold">{match.scores?.leetcode || 0}</span></div>
                     <div className="bg-main rounded px-2 py-1 flex justify-between items-center"><span className="text-text-muted">Codeforces</span> <span className="font-semibold">{match.scores?.cf || 0}</span></div>
                     <div className="bg-main rounded px-2 py-1 flex justify-between items-center"><span className="text-text-muted">Projects</span> <span className="font-semibold">{match.scores?.projects || 0}</span></div>
                   </div>
                 </div>
                 <div>
                   <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Top Languages</p>
                   <div className="flex flex-wrap gap-1.5">
                     {(match.topLanguages || match.user?.skills || [])?.slice(0,5).map((lang, i) => (
                       <span key={i} className="bg-input border border-border px-2 py-0.5 rounded text-[11px] text-text-primary">
                         {lang}
                       </span>
                     ))}
                   </div>
                 </div>
               </div>

               {/* Right: AI Match Insight */}
               <div className="flex-1 flex flex-col justify-center">
                 <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-text-muted uppercase tracking-wider">AI Match Score</span>
                     <span className="text-2xl font-black text-primary">{candidateScore}<span className="text-base text-text-muted font-normal">/100</span></span>
                   </div>
                   <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${fitStyles.bg} ${fitStyles.text} ${fitStyles.border}`}>
                     {fitLevel} Fit
                   </span>
                 </div>

                 <p className="text-sm font-semibold text-text-primary mb-2">Target Role: <span className="bg-input px-2 py-0.5 rounded text-xs">{match.targetRole}</span></p>

                 <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-xl mb-3">
                   <div className="flex items-start gap-2">
                     <SparklesIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                     <p className="text-sm text-text-primary leading-relaxed">{match.whyGoodFit || match.insight}</p>
                   </div>
                 </div>

                 {(match.concern || match.concerns) && (match.concern || match.concerns) !== "None" && (
                   <div className="flex items-start gap-2 text-xs text-warning bg-warning/10 p-3 rounded-lg border border-warning/20">
                     <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
                     <p><strong>Concern:</strong> {match.concern || match.concerns}</p>
                   </div>
                 )}
               </div>
            </div>
          );
        })}

        {!analyzing && matches.length === 0 && lastGenerated && (
          <EmptyState 
            icon={<SparklesIcon className="w-12 h-12 text-border" />}
            title="No matching candidates found"
            description="Try updating your open slot requirements (e.g. lowering the min score) or adding more descriptive skill tags to broaden the search."
          />
        )}
      </div>

    </div>
  );
};

export default AIMatch;
