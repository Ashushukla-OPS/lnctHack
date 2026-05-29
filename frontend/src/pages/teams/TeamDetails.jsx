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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/teams" className="p-2 rounded-lg hover:bg-input text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{team.teamName || team.name}</h1>
          {team.hackathon && (
            <p className="text-sm text-text-muted mt-1">Hackathon: {team.hackathon.name}</p>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border mb-8 overflow-x-auto">
        <nav className="flex space-x-8 min-w-max px-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-text-primary mb-4">Members</h2>
                  <div className="space-y-4">
                    {/* Leader */}
                    <div className="flex items-center justify-between p-4 bg-input/50 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                          {team.leader?.name?.charAt(0) || 'L'}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary flex items-center gap-2">
                            {team.leader?.name} <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded">LEADER</span>
                          </p>
                          <Link to={`/profile/${team.leader?.username || team.leader?._id}`} className="text-xs text-primary hover:underline">View Profile</Link>
                        </div>
                      </div>
                    </div>
                    {/* Members */}
                    {team.members?.map(member => (
                      <div key={member._id} className="flex items-center justify-between p-4 bg-input/50 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-input text-text-muted flex items-center justify-center font-bold">
                            {member.name?.charAt(0) || 'M'}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">{member.name}</p>
                            <Link to={`/profile/${member.username || member._id}`} className="text-xs text-primary hover:underline">View Profile</Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-text-primary mb-4">Open Slots</h2>
                  {team.openSlots?.length > 0 ? (
                    <div className="space-y-3">
                      {team.openSlots.map((slot, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-input/50 border border-border rounded-lg gap-4">
                          <div>
                            <p className="font-medium text-text-primary flex items-center gap-2">
                              {slot.role}
                              {slot.isFilled ? (
                                <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded border border-success/30">FILLED</span>
                              ) : (
                                <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded border border-warning/30">OPEN</span>
                              )}
                            </p>
                            <p className="text-xs text-text-muted mt-1">Min Score: {slot.minScore}</p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {slot.requiredSkills?.map((skill, sIdx) => (
                              <span key={sIdx} className="text-xs bg-card border border-border px-2 py-1 rounded text-text-muted">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted">No open slots available.</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Hackathon Starts In</h3>
                  {team.hackathon?.startDate ? (
                    <CountdownTimer targetDate={team.hackathon.startDate} />
                  ) : (
                    <span className="text-sm text-text-muted">Date not set</span>
                  )}
                </div>

                {chemistry && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 flex justify-between items-center">
                      Chemistry Score
                      <span className="text-2xl">🧪</span>
                    </h3>
                    <div className="text-center mb-4">
                      <span className="text-4xl font-bold text-primary">{chemistry.score}</span>
                      <span className="text-lg text-text-muted">/100</span>
                      <p className="text-sm font-medium mt-1 text-text-primary">{chemistry.verdict}</p>
                    </div>
                    <div className="space-y-2 mt-4">
                      {chemistry.strengths?.slice(0, 2).map((s, i) => (
                        <p key={i} className="text-xs text-text-muted flex items-start gap-2">
                          <span className="text-success mt-0.5">●</span> {s}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 space-y-3">
                  {isLeader && (
                    <>
                      <button className="w-full py-2 bg-input text-text-primary hover:bg-input/80 rounded-lg transition-colors font-medium border border-border">
                        Edit Team
                      </button>
                      <button className="w-full py-2 bg-input text-text-primary hover:bg-input/80 rounded-lg transition-colors font-medium border border-border">
                        Manage Slots
                      </button>
                    </>
                  )}
                  {isMember && !isLeader && (
                    <button onClick={handleLeaveTeam} className="w-full py-2 bg-danger/10 text-danger hover:bg-danger/20 rounded-lg transition-colors font-medium">
                      Leave Team
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-card border border-border rounded-xl h-[600px] overflow-hidden">
             {isMember ? <TeamChat isEmbed={true} teamId={teamId} /> : <div className="p-8 text-center text-text-muted">Members only feature.</div>}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-card border border-border rounded-xl min-h-[600px]">
             {isMember ? <TaskBoard isEmbed={true} teamId={teamId} /> : <div className="p-8 text-center text-text-muted">Members only feature.</div>}
          </div>
        )}

        {activeTab === 'meet' && (
          <div className="space-y-6">
            {!isMember ? (
              <div className="p-8 text-center text-text-muted bg-card border border-border rounded-xl">Members only feature.</div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-text-primary">Team Meetings</h2>
                  {isLeader && (
                    <button 
                      onClick={() => setShowMeetModal(true)}
                      className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Schedule Meet
                    </button>
                  )}
                </div>
                {meets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {meets.map(meet => (
                      <div key={meet._id} className="bg-card border border-border rounded-xl p-5">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-text-primary">{meet.title}</h3>
                          {meet.status === 'live' && (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-success bg-success/10 px-2 py-1 rounded border border-success/20">
                              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span> LIVE
                            </span>
                          )}
                          {meet.status === 'scheduled' && (
                            <span className="text-xs font-medium text-text-muted bg-input px-2 py-1 rounded">Scheduled</span>
                          )}
                        </div>
                        <p className="text-sm text-text-muted mb-4">
                          {new Date(meet.scheduledAt).toLocaleString()} • {meet.duration} min
                        </p>
                        <div className="flex gap-2">
                          {meet.status === 'scheduled' && isLeader && (
                            <button onClick={() => handleStartMeet(meet.roomId)} className="flex-1 bg-primary text-white py-1.5 rounded-lg text-sm font-medium">Start Meet</button>
                          )}
                          {meet.status === 'live' && (
                            <Link to={`/meet/${meet.roomId}`} className="flex-1 bg-success text-white py-1.5 rounded-lg text-sm font-medium text-center">Join Meet</Link>
                          )}
                          {meet.status === 'scheduled' && isLeader && (
                            <button onClick={() => handleCancelMeet(meet._id)} className="px-3 py-1.5 bg-danger/10 text-danger rounded-lg text-sm font-medium">Cancel</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={<VideoCameraIcon className="w-12 h-12 text-text-muted" />} title="No meetings scheduled" description="Use this space for video standups and brainstorming." />
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            {!isMember ? (
              <div className="p-8 text-center text-text-muted bg-card border border-border rounded-xl">Members only feature.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* AI Match - Leader Only */}
                {isLeader && (
                  <div className="bg-card border border-border rounded-xl p-6 md:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2"><SparklesIcon className="w-6 h-6 text-primary"/> AI Matchmaker</h2>
                      <button onClick={fetchAiMatch} disabled={aiLoading.match} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                        {aiLoading.match ? 'Finding...' : 'Find Matching Teammates'}
                      </button>
                    </div>
                    {aiMatch.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {aiMatch.map((match, i) => (
                          <div key={i} className="bg-input/50 border border-border p-4 rounded-lg">
                            <p className="font-bold text-text-primary">{match.user?.name}</p>
                            <p className="text-xs text-text-muted mb-2">Fit: {match.fitRating}/10</p>
                            <p className="text-sm text-text-primary line-clamp-2">{match.insight}</p>
                            <button className="mt-3 w-full py-1.5 bg-card border border-border text-primary rounded-lg text-sm font-medium hover:bg-primary/10">Invite</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Skill Gap */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-text-primary">Skill Gap Analysis</h2>
                    <button onClick={fetchSkillGap} disabled={aiLoading.skillGap} className="text-sm text-primary hover:underline disabled:opacity-50">Analyze</button>
                  </div>
                  {skillGap ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Critical Gaps</h4>
                        <div className="flex flex-wrap gap-2">
                          {skillGap.criticalGaps?.map((gap, i) => <span key={i} className="bg-danger/10 text-danger border border-danger/20 px-2 py-1 rounded text-xs">{gap}</span>)}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Nice to Have</h4>
                        <div className="flex flex-wrap gap-2">
                          {skillGap.niceToHave?.map((gap, i) => <span key={i} className="bg-warning/10 text-warning border border-warning/20 px-2 py-1 rounded text-xs">{gap}</span>)}
                        </div>
                      </div>
                      <p className="text-sm text-text-primary mt-2"><strong>Recommendation:</strong> {skillGap.recommendation}</p>
                    </div>
                  ) : <p className="text-sm text-text-muted italic">Click Analyze to detect missing skills based on current members and open slots.</p>}
                </div>

                {/* Project Summary */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-text-primary">Project Summary</h2>
                    <button onClick={fetchSummary} disabled={aiLoading.summary} className="text-sm text-primary hover:underline disabled:opacity-50">Generate</button>
                  </div>
                  {projectSummary ? (
                     <p className="text-sm text-text-primary whitespace-pre-wrap">{projectSummary.summary}</p>
                  ) : <p className="text-sm text-text-muted italic">Generate an AI summary of the project tasks, chat, and status.</p>}
                </div>

                {/* Idea Validator */}
                <div className="bg-card border border-border rounded-xl p-6 md:col-span-2">
                   <h2 className="text-xl font-semibold text-text-primary mb-4">Idea Validator</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <form onSubmit={handleValidateIdea} className="space-y-4">
                       <input type="text" placeholder="Idea Title" required value={ideaForm.title} onChange={e => setIdeaForm({...ideaForm, title: e.target.value})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary"/>
                       <textarea placeholder="Description" required rows="3" value={ideaForm.description} onChange={e => setIdeaForm({...ideaForm, description: e.target.value})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary resize-none"></textarea>
                       <input type="text" placeholder="Target Users" required value={ideaForm.targetUsers} onChange={e => setIdeaForm({...ideaForm, targetUsers: e.target.value})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary"/>
                       <input type="text" placeholder="Tech Stack" required value={ideaForm.techStack} onChange={e => setIdeaForm({...ideaForm, techStack: e.target.value})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary"/>
                       <button type="submit" disabled={aiLoading.validate} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 w-full">{aiLoading.validate ? 'Validating...' : 'Validate Idea'}</button>
                     </form>
                     
                     <div className="bg-input/30 border border-border rounded-lg p-5">
                       {ideaValid ? (
                         <div>
                           <div className="flex justify-between items-center mb-4">
                             <h3 className="font-bold text-lg text-text-primary">{ideaValid.verdict}</h3>
                             <span className="text-xl font-black text-primary">{ideaValid.overallScore}/10</span>
                           </div>
                           <p className="text-sm text-text-muted mb-4">{ideaValid.summary}</p>
                           <div className="space-y-2">
                             {['feasibility', 'innovation', 'marketFit'].map(key => (
                               <div key={key} className="flex justify-between items-center text-sm">
                                 <span className="text-text-muted capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                 <span className="font-medium text-text-primary">{ideaValid.ratings[key]}/10</span>
                               </div>
                             ))}
                           </div>
                         </div>
                       ) : <p className="text-sm text-text-muted italic text-center mt-10">Submit your idea to get brutal, actionable feedback from Gemini.</p>}
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
        <form onSubmit={handleScheduleMeet} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Title</label>
            <input type="text" required value={meetForm.title} onChange={e => setMeetForm({...meetForm, title: e.target.value})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary" placeholder="e.g. Daily Standup"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Date</label>
              <input type="date" required value={meetForm.date} onChange={e => setMeetForm({...meetForm, date: e.target.value})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Time</label>
              <input type="time" required value={meetForm.time} onChange={e => setMeetForm({...meetForm, time: e.target.value})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Duration (min)</label>
            <select value={meetForm.duration} onChange={e => setMeetForm({...meetForm, duration: Number(e.target.value)})} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary">
              <option value={30}>30</option>
              <option value={60}>60</option>
              <option value={90}>90</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setShowMeetModal(false)} className="px-4 py-2 rounded-lg text-text-muted hover:bg-input font-medium">Cancel</button>
            <button type="submit" disabled={meetLoading} className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50">Schedule</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default TeamDetails;
