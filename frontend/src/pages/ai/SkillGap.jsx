import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../../utils/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { 
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

const SkillGap = () => {
  const { teamId } = useParams();
  
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/teams/${teamId}`);
      setTeam(res.data?.data || res.data);
    } catch (error) {
      toast.error('Failed to load team info');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      const res = await axios.get(`/ai/skill-gap/${teamId}`);
      const data = res.data?.data || res.data;
      
      // Fallback structure in case backend sends it directly
      setResult({
        criticalGaps: data.criticalGaps || [],
        niceToHave: data.niceToHave || [],
        recommendation: data.recommendation || '',
        resources: data.resources || [],
        generatedAt: data.generatedAt || new Date().toISOString()
      });
      
      toast.success('Skill gap analysis complete!');
    } catch (error) {
      toast.error('Failed to analyze skill gaps');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  if (!team) return null;

  // Extract all current skills from team members
  const currentSkills = new Set();
  if (team.leader?.topLanguages) team.leader.topLanguages.forEach(l => currentSkills.add(l));
  team.members?.forEach(m => {
    if (m.topLanguages) m.topLanguages.forEach(l => currentSkills.add(l));
  });
  const currentSkillsArray = Array.from(currentSkills);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to={`/teams/${teamId}`} className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors mb-6">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Team
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4 border-b border-border pb-8">
        <div>
          <h1 className="text-3xl font-black text-text-primary mb-2">Skill Gap Detector</h1>
          <p className="text-text-muted">Find exactly what your team is missing to win.</p>
        </div>
        
        <div className="flex flex-col items-end shrink-0">
          {result && (
            <span className="text-xs text-text-muted mb-2">
              Analyzed {formatDistanceToNow(new Date(result.generatedAt), { addSuffix: true })}
            </span>
          )}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            {analyzing ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Analyzing...</>
            ) : (
              <><MagnifyingGlassIcon className="w-5 h-5" /> {result ? 'Re-analyze Gaps' : 'Analyze Skill Gaps'}</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Current Skills Base */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-full">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-success" /> Your Team Has
          </h2>
          {currentSkillsArray.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentSkillsArray.map((skill, i) => (
                <span key={i} className="bg-success/10 border border-success/30 text-success px-3 py-1.5 rounded-lg text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted italic">No specific skills detected in member profiles yet.</p>
          )}
        </div>

        {/* Required By Open Slots */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-full">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <InformationCircleIcon className="w-5 h-5 text-primary" /> Slots Require
          </h2>
          {team.openSlots?.filter(s => !s.isFilled).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {team.openSlots.filter(s => !s.isFilled).map((slot) => (
                slot.requiredSkills?.map((skill, i) => (
                  <span key={`${slot._id}-${i}`} className="bg-input border border-border text-text-primary px-3 py-1.5 rounded-lg text-sm font-medium">
                    {skill} <span className="text-text-muted text-xs ml-1 font-normal">({slot.role})</span>
                  </span>
                ))
              ))}
            </div>
          ) : (
             <p className="text-sm text-text-muted italic">No open slots with specific requirements.</p>
          )}
        </div>
      </div>

      {analyzing && !result && (
        <div className="bg-main border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <MagnifyingGlassIcon className="w-12 h-12 text-primary animate-pulse mb-4" />
          <h3 className="text-xl font-bold text-text-primary">Gemini is cross-referencing skills...</h3>
          <p className="text-sm text-text-muted mt-2">Identifying critical blockers for your product development.</p>
        </div>
      )}

      {result && !analyzing && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-primary mb-2">Next Recruit Should Be:</h2>
            <p className="text-text-primary text-xl font-medium leading-relaxed">{result.recommendation}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-danger mb-4 flex items-center gap-2">
                <ExclamationCircleIcon className="w-5 h-5" /> Critical Missing Skills
              </h2>
              {result.criticalGaps?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.criticalGaps.map((skill, i) => (
                    <span key={i} className="bg-danger/10 border border-danger/30 text-danger px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-success font-medium bg-success/10 p-3 rounded-lg">No critical gaps! 🎉 You have the core tech covered.</p>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-warning mb-4 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5" /> Would Be Helpful
              </h2>
              {result.niceToHave?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.niceToHave.map((skill, i) => (
                    <span key={i} className="bg-warning/10 border border-warning/30 text-warning px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted bg-input p-3 rounded-lg">All good here! No extra skills immediately recommended.</p>
              )}
            </div>
          </div>

          {result.resources?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
                <BookOpenIcon className="w-5 h-5 text-primary" /> Quick Learning Resources
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.resources.map((res, i) => (
                  <div key={i} className="bg-input border border-border rounded-xl p-4 flex items-start gap-3">
                    <div className="bg-primary/20 text-primary p-2 rounded-lg shrink-0 mt-0.5">
                      <BookOpenIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary mb-1">{res.skill || 'Skill'}</p>
                      <p className="text-xs text-text-muted">{res.name || res.resource || res}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default SkillGap;
