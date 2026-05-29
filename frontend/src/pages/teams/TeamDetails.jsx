import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import CountdownTimer from '../../components/CountdownTimer';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import TeamChat from '../chat/TeamChat';
import TaskBoard from '../tasks/TaskBoard';
import { 
  ArrowLeftIcon,
  VideoCameraIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const TeamDetails = () => {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Tab 4: Meet state
  const [meets, setMeets] = useState([]);
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [meetForm, setMeetForm] = useState({ title: '', date: '', time: '', duration: 30 });
  
  // Tab 5: AI state
  const [chemistry, setChemistry] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [ideaValid, setIdeaValid] = useState(null);
  const [aiMatch, setAiMatch] = useState([]);
  const [projectSummary, setProjectSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState({ chemistry: false, skillGap: false, validate: false, match: false, summary: false });
  const [ideaForm, setIdeaForm] = useState({ title: '', description: '', targetUsers: '', techStack: '' });

  const isLeader = team?.leader?._id === user?._id;
  const isMember = isLeader || team?.members?.some(m => m._id === user?._id);

  useEffect(() => {
    fetchTeamData();
    if (isMember) {
      fetchMeets();
    }
  }, [teamId, isMember]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/teams/${teamId}`);
      setTeam(res.data?.team || res.data?.data || res.data);
      // Try to preload chemistry
      const chemRes = await axios.get(`/ai/chemistry/${teamId}`).catch(() => null);
      if (chemRes) setChemistry(chemRes.data?.data || chemRes.data);
    } catch (error) {
      toast.error('Failed to load team details');
      navigate('/teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeets = async () => {
    try {
      const res = await axios.get(`/meet/${teamId}`);
      setMeets(res.data?.data || res.data || []);
    } catch (error) {
      // Ignore if not implemented on backend yet
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    try {
      await axios.patch(`/teams/${teamId}/leave`);
      toast.success('You have left the team');
      navigate('/teams');
    } catch (error) {
      toast.error('Failed to leave team');
    }
  };

  const handleScheduleMeet = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/meet/schedule/${teamId}`, meetForm);
      toast.success('Meet scheduled');
      setShowMeetModal(false);
      fetchMeets();
    } catch (error) {
      toast.error('Failed to schedule meet');
    }
  };

  const handleStartMeet = async (roomId) => {
    try {
      await axios.patch(`/meet/start/${roomId}`);
      toast.success('Meet started!');
      navigate(`/meet/${roomId}`);
    } catch (error) {
      toast.error('Failed to start meet');
    }
  };

  const handleCancelMeet = async (meetId) => {
    if (!window.confirm('Cancel this meet?')) return;
    try {
      await axios.delete(`/meet/${meetId}`);
      toast.success('Meet cancelled');
      fetchMeets();
    } catch (error) {
      toast.error('Failed to cancel meet');
    }
  };

  // AI Function handlers
  const fetchSkillGap = async () => {
    setAiLoading(prev => ({...prev, skillGap: true}));
    try {
      const res = await axios.get(`/ai/skill-gap/${teamId}`);
      setSkillGap(res.data?.data || res.data);
    } catch (err) { toast.error('Skill gap analysis failed'); }
    finally { setAiLoading(prev => ({...prev, skillGap: false})); }
  };

  const handleValidateIdea = async (e) => {
    e.preventDefault();
    setAiLoading(prev => ({...prev, validate: true}));
    try {
      const res = await axios.post(`/ai/validate-idea/${teamId}`, ideaForm);
      setIdeaValid(res.data?.data || res.data);
    } catch (err) { toast.error('Idea validation failed'); }
    finally { setAiLoading(prev => ({...prev, validate: false})); }
  };

  const fetchAiMatch = async () => {
    setAiLoading(prev => ({...prev, match: true}));
    try {
      const res = await axios.get(`/ai/match/${teamId}`);
      setAiMatch(res.data?.data || res.data || []);
    } catch (err) { toast.error('Matchmaker failed'); }
    finally { setAiLoading(prev => ({...prev, match: false})); }
  };

  const fetchSummary = async () => {
    setAiLoading(prev => ({...prev, summary: true}));
    try {
      const res = await axios.get(`/summary/${teamId}/project`);
      setProjectSummary(res.data?.data || res.data);
    } catch (err) { toast.error('Summary failed'); }
    finally { setAiLoading(prev => ({...prev, summary: false})); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>;
  if (!team) return null;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: InformationCircleIcon },
    { id: 'chat', name: 'Chat', icon: ChatBubbleLeftRightIcon },
    { id: 'tasks', name: 'Tasks', icon: ClipboardDocumentListIcon },
    { id: 'meet', name: 'Meet', icon: VideoCameraIcon },
    { id: 'ai', name: 'AI Tools', icon: SparklesIcon }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in font-sans relative overflow-hidden">
      
      {/* Visual neon backdrops */}
      <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#232329] pb-6 relative z-10">
        <div className="flex items-center gap-4">
          <Link 
            to="/teams" 
            className="p-2.5 bg-[#141417]/85 border border-[#232329] rounded-xl hover:border-violet-500/30 text-text-muted hover:text-white transition-all flex items-center justify-center shadow-md"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              {team.teamName || team.name}
            </h1>
            {team.hackathon && (
              <p className="text-xs text-violet-400 font-bold mt-1 uppercase tracking-wider flex items-center gap-1.5">
                <span>🏆</span> Hackathon: <span className="text-white font-medium normal-case">{team.hackathon.name}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#232329] mb-8 overflow-x-auto relative z-10">
        <nav className="flex space-x-8 min-w-max px-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:border-[#232329]'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[500px] relative z-10">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="md:col-span-2 space-y-6">
                <div className="glass-card bg-[#141417]/85 border border-[#232329] rounded-2xl p-6 shadow-lg">
                  <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                    <span>👥</span> Team Members
                  </h2>
                  <div className="space-y-4">
                    {/* Leader */}
                    <div className="flex items-center justify-between p-4 bg-[#1a1a1f]/80 border border-[#232329] rounded-xl hover:border-violet-500/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-lg shadow-inner">
                          {team.leader?.name?.charAt(0).toUpperCase() || 'L'}
                        </div>
                        <div>
                          <p className="font-bold text-white flex items-center gap-2">
                            {team.leader?.name} 
                            <span className="text-[9px] bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-sm tracking-wider uppercase">
                              LEADER
                            </span>
                          </p>
                          <Link 
                            to={`/profile/${team.leader?.username || team.leader?._id}`} 
                            className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 mt-1 transition-colors"
                          >
                            View Profile <span>→</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                    {/* Members */}
                    {team.members?.map(member => (
                      <div key={member._id} className="flex items-center justify-between p-4 bg-[#16161a]/60 border border-[#232329] rounded-xl hover:border-violet-500/20 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#1e1e24] border border-[#232329] text-text-muted flex items-center justify-center font-bold text-lg">
                            {member.name?.charAt(0).toUpperCase() || 'M'}
                          </div>
                          <div>
                            <p className="font-bold text-white">{member.name}</p>
                            <Link 
                              to={`/profile/${member.username || member._id}`} 
                              className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 mt-1 transition-colors"
                            >
                              View Profile <span>→</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card bg-[#141417]/85 border border-[#232329] rounded-2xl p-6 shadow-lg">
                  <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                    <span>🎯</span> Open Slots
                  </h2>
                  {team.openSlots?.length > 0 ? (
                    <div className="space-y-4">
                      {team.openSlots.map((slot, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#16161a]/60 border border-[#232329] rounded-xl gap-4 hover:border-violet-500/20 transition-all">
                          <div>
                            <p className="font-bold text-white flex items-center gap-2">
                              {slot.role}
                              {slot.isFilled ? (
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider">FILLED</span>
                              ) : (
                                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold uppercase tracking-wider">OPEN</span>
                              )}
                            </p>
                            <p className="text-xs text-text-muted mt-1.5 font-medium flex items-center gap-1">
                              <span>🏆</span> Min Score: <span className="text-white font-bold">{slot.minScore}</span>
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {slot.requiredSkills?.map((skill, sIdx) => (
                              <span key={sIdx} className="text-xs bg-[#1a1a1f] border border-[#2c2c35] px-2.5 py-1 rounded-full text-text-muted font-semibold">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-[#16161a]/40 border border-dashed border-[#232329] rounded-xl">
                      <p className="text-sm text-text-muted font-medium">No open slots available for this squad.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="glass-card bg-[#141417]/85 border border-[#232329] rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Hackathon Starts In</h3>
                  {team.hackathon?.startDate ? (
                    <div className="py-2 flex justify-center">
                      <CountdownTimer targetDate={team.hackathon.startDate} />
                    </div>
                  ) : (
                    <span className="text-sm text-text-muted font-semibold">Date not set</span>
                  )}
                </div>

                {chemistry && (
                  <div className="glass-card bg-[#141417]/85 border border-[#232329] rounded-2xl p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-600/5 rounded-full blur-2xl pointer-events-none" />
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-5 flex justify-between items-center">
                      <span>Team Chemistry</span>
                      <span className="text-xl animate-bounce">🧪</span>
                    </h3>
                    <div className="text-center mb-6">
                      <div className="inline-flex items-baseline gap-1 relative">
                        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">{chemistry.score}</span>
                        <span className="text-sm text-text-muted font-bold">/100</span>
                      </div>
                      <p className="text-sm font-extrabold mt-2 text-white">{chemistry.verdict}</p>
                    </div>
                    <div className="space-y-3 mt-4 border-t border-[#232329] pt-4">
                      {chemistry.strengths?.slice(0, 3).map((s, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-text-muted font-medium">
                          <span className="text-emerald-400 text-[10px] mt-1 shrink-0">✔</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 space-y-3">
                  {isLeader && (
                    <>
                      <button className="w-full py-3 bg-[#1e1e24] hover:bg-[#25252d] text-white rounded-xl transition-all font-bold border border-[#2c2c35] hover:border-violet-500/30 flex items-center justify-center gap-2 text-sm shadow-md">
                        <span>✏</span> Edit Team
                      </button>
                      <button className="w-full py-3 bg-[#1e1e24] hover:bg-[#25252d] text-white rounded-xl transition-all font-bold border border-[#2c2c35] hover:border-violet-500/30 flex items-center justify-center gap-2 text-sm shadow-md">
                        <span>⚙</span> Manage Slots
                      </button>
                    </>
                  )}
                  {isMember && !isLeader && (
                    <button 
                      onClick={handleLeaveTeam} 
                      className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 rounded-xl transition-all font-bold text-sm shadow-md flex items-center justify-center gap-2"
                    >
                      <span>🚪</span> Leave Team
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="glass-card bg-[#141417]/85 border border-[#232329] rounded-2xl h-[600px] overflow-hidden shadow-xl animate-fade-in">
             {isMember ? <TeamChat isEmbed={true} teamId={teamId} /> : <div className="p-8 text-center text-text-muted">Members only feature.</div>}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="glass-card bg-[#141417]/85 border border-[#232329] rounded-2xl min-h-[600px] shadow-xl p-1 overflow-hidden animate-fade-in">
             {isMember ? <TaskBoard isEmbed={true} teamId={teamId} /> : <div className="p-8 text-center text-text-muted">Members only feature.</div>}
          </div>
        )}

        {activeTab === 'meet' && (
          <div className="space-y-6 animate-fade-in">
            {!isMember ? (
              <div className="p-8 text-center text-text-muted glass-card bg-[#141417]/85 border border-[#232329] rounded-2xl shadow-lg">Members only feature.</div>
            ) : (
              <>
                <div className="flex justify-between items-center border-b border-[#232329] pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Team Meetings</h2>
                    <p className="text-xs text-text-muted mt-0.5 font-medium">Coordinate standups, pair program, and brainstorm with WebRTC audio & video.</p>
                  </div>
                  {isLeader && (
                    <button 
                      onClick={() => setShowMeetModal(true)}
                      className="btn-primary text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-violet-500/10 flex items-center gap-1.5 animate-pulse"
                    >
                      <span>📅</span> Schedule Meet
                    </button>
                  )}
                </div>
                {meets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {meets.map(meet => (
                      <div key={meet._id} className="glass-card bg-[#141417]/85 border border-[#232329] rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-violet-500/20 transition-all">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-white text-base tracking-tight">{meet.title}</h3>
                            {meet.status === 'live' && (
                              <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> LIVE
                              </span>
                            )}
                            {meet.status === 'scheduled' && (
                              <span className="text-[10px] font-bold text-text-muted bg-[#1e1e24] px-2.5 py-1 rounded-full border border-[#2c2c35] tracking-wider uppercase">Scheduled</span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted mb-6 font-medium flex items-center gap-1.5">
                            <span>🕒</span> {new Date(meet.scheduledAt).toLocaleString()} • <span className="text-white font-bold">{meet.duration} min</span>
                          </p>
                        </div>
                        <div className="flex gap-2.5 border-t border-[#232329] pt-4 mt-auto">
                          {meet.status === 'scheduled' && isLeader && (
                            <button 
                              onClick={() => handleStartMeet(meet.roomId)} 
                              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/10 flex items-center justify-center gap-1"
                            >
                              <span>🚀</span> Start Meet
                            </button>
                          )}
                          {meet.status === 'live' && (
                            <Link 
                              to={`/meet/${meet.roomId}`} 
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold text-center transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1"
                            >
                              <span>⚡</span> Join Meet
                            </Link>
                          )}
                          {meet.status === 'scheduled' && isLeader && (
                            <button 
                              onClick={() => handleCancelMeet(meet._id)} 
                              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold border border-rose-500/20 transition-all"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card bg-[#141417]/85 border border-[#232329] rounded-2xl p-12 text-center shadow-lg">
                    <EmptyState 
                      icon={<span className="text-4xl block mb-2 select-none">🎥</span>} 
                      title="No meetings scheduled" 
                      description="Schedule interactive voice and video standups directly with your team." 
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-8 animate-fade-in">
            {!isMember ? (
              <div className="p-8 text-center text-text-muted glass-card bg-[#141417]/85 border border-[#232329] rounded-2xl shadow-lg">Members only feature.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* AI Match - Leader Only */}
                {isLeader && (
                  <div className="glass-card bg-[#141417]/85 border border-[#232329] rounded-2xl p-6 md:col-span-2 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-[#232329] pb-4">
                      <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <SparklesIcon className="w-5 h-5 text-violet-400 animate-pulse"/> AI Teammate Matchmaker
                        </h2>
                        <p className="text-xs text-text-muted mt-0.5 font-medium">Scans the global developer directory to match candidates with open slots using Gemini analysis.</p>
                      </div>
                      <button 
                        onClick={fetchAiMatch} 
                        disabled={aiLoading.match} 
                        className="btn-primary text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-violet-500/10 disabled:opacity-50"
                      >
                        {aiLoading.match ? 'Scanning Talent Network...' : '✨ Find Best Matches'}
                      </button>
                    </div>
                    
                    {aiMatch.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {aiMatch.map((match, i) => (
                          <div key={i} className="bg-[#16161a]/60 border border-[#232329] p-5 rounded-xl flex flex-col justify-between hover:border-violet-500/20 transition-all">
                            <div>
                              <div className="flex justify-between items-start mb-3">
                                <p className="font-bold text-white text-sm">{match.user?.name}</p>
                                <span className="text-[10px] font-black bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Fit: {match.fitRating}/10
                                </span>
                              </div>
                              <p className="text-xs text-text-muted font-medium leading-relaxed mb-4">{match.insight}</p>
                            </div>
                            <button className="w-full py-2 bg-[#1e1e24] hover:bg-[#25252d] border border-[#2c2c35] text-violet-400 rounded-lg text-xs font-bold transition-all mt-auto flex items-center justify-center gap-1.5">
                              <span>✉</span> Invite Teammate
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-[#16161a]/40 border border-dashed border-[#232329] rounded-xl">
                        <p className="text-xs text-text-muted font-medium">Click matching button to find candidates for open slots.</p>
                      </div>
                    )}
                  </div>
                )}
 
                {/* Skill Gap */}
                <div className="glass-card bg-[#141417]/85 border border-[#232329] rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-5 border-b border-[#232329] pb-3">
                      <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                        <span>📊</span> Skill Gap Analysis
                      </h2>
                      <button 
                        onClick={fetchSkillGap} 
                        disabled={aiLoading.skillGap} 
                        className="text-xs text-violet-400 hover:text-violet-300 font-bold transition-all disabled:opacity-50"
                      >
                        {aiLoading.skillGap ? 'Analyzing...' : 'Analyze Squad'}
                      </button>
                    </div>
                    {skillGap ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <span>●</span> Critical Gaps
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {skillGap.criticalGaps?.map((gap, i) => (
                              <span key={i} className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                {gap}
                              </span>
                            ))}
                            {(!skillGap.criticalGaps || skillGap.criticalGaps.length === 0) && (
                              <span className="text-xs text-text-muted font-medium italic">None detected</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <span>●</span> Optional / Nice to Have
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {skillGap.niceToHave?.map((gap, i) => (
                              <span key={i} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                {gap}
                              </span>
                            ))}
                            {(!skillGap.niceToHave || skillGap.niceToHave.length === 0) && (
                              <span className="text-xs text-text-muted font-medium italic">None detected</span>
                            )}
                          </div>
                        </div>
                        <div className="bg-[#16161a]/60 border border-[#232329] p-3 rounded-xl mt-3">
                          <p className="text-xs text-text-muted leading-relaxed font-medium">
                            <strong className="text-white font-bold block mb-1">💡 Smart Recommendation:</strong> 
                            {skillGap.recommendation}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-[#16161a]/40 border border-dashed border-[#232329] rounded-xl flex items-center justify-center min-h-[160px]">
                        <p className="text-xs text-text-muted font-medium max-w-[80%] italic">Detect missing engineering profiles based on scheduled sprint tasks and team profile databases.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Summary */}
                <div className="glass-card bg-[#141417]/85 border border-[#232329] rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-5 border-b border-[#232329] pb-3">
                      <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                        <span>📝</span> AI Project Briefing
                      </h2>
                      <button 
                        onClick={fetchSummary} 
                        disabled={aiLoading.summary} 
                        className="text-xs text-violet-400 hover:text-violet-300 font-bold transition-all disabled:opacity-50"
                      >
                        {aiLoading.summary ? 'Synthesizing...' : 'Generate Brief'}
                      </button>
                    </div>
                    {projectSummary ? (
                       <div className="bg-[#16161a]/60 border border-[#232329] p-4 rounded-xl max-h-[220px] overflow-y-auto">
                         <p className="text-xs text-text-muted leading-relaxed font-medium whitespace-pre-wrap">{projectSummary.summary}</p>
                       </div>
                    ) : (
                      <div className="text-center py-10 bg-[#16161a]/40 border border-dashed border-[#232329] rounded-xl flex items-center justify-center min-h-[160px]">
                        <p className="text-xs text-text-muted font-medium max-w-[80%] italic">Synthesize active task statuses, chat conversations, and files into an executive project progress summary.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Idea Validator */}
                <div className="glass-card bg-[#141417]/85 border border-[#232329] rounded-2xl p-6 md:col-span-2 shadow-lg">
                   <div className="border-b border-[#232329] pb-4 mb-5">
                     <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                       <span>💡</span> Pitch & Product Idea Validator
                     </h2>
                     <p className="text-xs text-text-muted mt-0.5 font-medium">Submit your project idea to receive a technical feasibility review and rating breakdown from Gemini.</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <form onSubmit={handleValidateIdea} className="space-y-4">
                       <div>
                         <input 
                           type="text" 
                           placeholder="Project Title" 
                           required 
                           value={ideaForm.title} 
                           onChange={e => setIdeaForm({...ideaForm, title: e.target.value})} 
                           className="w-full bg-[#16161a] border border-[#232329] rounded-xl px-4 py-2.5 text-xs text-white placeholder-text-muted/40 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all font-medium"
                         />
                       </div>
                       <div>
                         <textarea 
                           placeholder="Pitch Description (Explain product objective, solution, target audience...)" 
                           required 
                           rows="4" 
                           value={ideaForm.description} 
                           onChange={e => setIdeaForm({...ideaForm, description: e.target.value})} 
                           className="w-full bg-[#16161a] border border-[#232329] rounded-xl px-4 py-2.5 text-xs text-white placeholder-text-muted/40 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all font-medium resize-none"
                         ></textarea>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         <input 
                           type="text" 
                           placeholder="Target Segment" 
                           required 
                           value={ideaForm.targetUsers} 
                           onChange={e => setIdeaForm({...ideaForm, targetUsers: e.target.value})} 
                           className="w-full bg-[#16161a] border border-[#232329] rounded-xl px-4 py-2.5 text-xs text-white placeholder-text-muted/40 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all font-medium"
                         />
                         <input 
                           type="text" 
                           placeholder="Tech Stack" 
                           required 
                           value={ideaForm.techStack} 
                           onChange={e => setIdeaForm({...ideaForm, techStack: e.target.value})} 
                           className="w-full bg-[#16161a] border border-[#232329] rounded-xl px-4 py-2.5 text-xs text-white placeholder-text-muted/40 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all font-medium"
                         />
                       </div>
                       <button 
                         type="submit" 
                         disabled={aiLoading.validate} 
                         className="btn-primary text-xs font-bold py-2.5 rounded-xl shadow-lg shadow-violet-500/10 w-full disabled:opacity-50 transition-all"
                       >
                         {aiLoading.validate ? 'Analyzing Pitch Feasibility...' : '🚀 Submit Idea to Validator'}
                       </button>
                     </form>
                     
                     <div className="bg-[#16161a]/60 border border-[#232329] rounded-xl p-5 flex flex-col justify-center min-h-[220px]">
                       {ideaValid ? (
                         <div className="space-y-4">
                           <div className="flex justify-between items-center border-b border-[#232329] pb-3">
                             <div>
                               <h3 className="font-extrabold text-sm text-white tracking-tight uppercase">{ideaValid.verdict}</h3>
                               <p className="text-[10px] text-text-muted mt-0.5 font-bold">Overall Verdict</p>
                             </div>
                             <span className="text-2xl font-black text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-xl">
                               {ideaValid.overallScore}/10
                             </span>
                           </div>
                           <p className="text-xs text-text-muted leading-relaxed font-medium">{ideaValid.summary}</p>
                           <div className="space-y-2.5 border-t border-[#232329] pt-3.5">
                             {['feasibility', 'innovation', 'marketFit'].map(key => (
                               <div key={key} className="flex justify-between items-center text-xs">
                                 <span className="text-text-muted capitalize font-semibold">{key.replace(/([A-Z])/g, ' $1')}</span>
                                 <div className="flex items-center gap-2">
                                   <div className="w-24 h-1.5 bg-[#1e1e24] rounded-full overflow-hidden border border-[#2c2c35]">
                                     <div 
                                       className="h-full bg-gradient-to-r from-violet-500 to-indigo-500" 
                                       style={{ width: `${(ideaValid.ratings?.[key] || 0) * 10}%` }}
                                     />
                                   </div>
                                   <span className="font-bold text-white min-w-[32px] text-right">{ideaValid.ratings?.[key] || 0}/10</span>
                                 </div>
                                </div>
                             ))}
                           </div>
                         </div>
                       ) : (
                         <div className="text-center py-6">
                           <span className="text-3xl block mb-2">📊</span>
                           <p className="text-xs text-text-muted font-medium max-w-[80%] mx-auto italic">Submit your proposal on the left to receive a breakdown across Feasibility, Innovation, and Market Fit metrics.</p>
                         </div>
                       )}
                     </div>
                   </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {/* Meet Modal */}
      <Modal isOpen={showMeetModal} onClose={() => setShowMeetModal(false)} title="Schedule a Meet">
        <form onSubmit={handleScheduleMeet} className="space-y-5 font-sans">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Title</label>
            <input 
              type="text" 
              required 
              value={meetForm.title} 
              onChange={e => setMeetForm({...meetForm, title: e.target.value})} 
              className="w-full bg-[#16161a] border border-[#232329] rounded-xl px-4 py-2.5 text-xs text-white placeholder-text-muted/40 outline-none focus:border-violet-500 transition-all font-medium" 
              placeholder="e.g. Daily Standup / Sprint Planning"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Date</label>
              <input 
                type="date" 
                required 
                value={meetForm.date} 
                onChange={e => setMeetForm({...meetForm, date: e.target.value})} 
                className="w-full bg-[#16161a] border border-[#232329] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition-all font-medium cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Time</label>
              <input 
                type="time" 
                required 
                value={meetForm.time} 
                onChange={e => setMeetForm({...meetForm, time: e.target.value})} 
                className="w-full bg-[#16161a] border border-[#232329] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition-all font-medium cursor-pointer"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Duration (minutes)</label>
            <select 
              value={meetForm.duration} 
              onChange={e => setMeetForm({...meetForm, duration: Number(e.target.value)})} 
              className="w-full bg-[#16161a] border border-[#232329] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition-all font-medium cursor-pointer appearance-none"
            >
              <option value={30}>30 Minutes</option>
              <option value={60}>60 Minutes</option>
              <option value={90}>90 Minutes</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-[#232329]">
            <button 
              type="button" 
              onClick={() => setShowMeetModal(false)} 
              className="btn-secondary px-5 py-2.5 text-xs rounded-xl font-bold transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary px-5 py-2.5 text-xs rounded-xl font-bold shadow-lg shadow-violet-500/10 transition-all"
            >
              Schedule Meet 📅
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default TeamDetails;
