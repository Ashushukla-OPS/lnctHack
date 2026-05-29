import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import { 
  ArrowLeftIcon,
  SparklesIcon,
  FireIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const IdeaValidator = () => {
  const { teamId } = useParams();
  
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetUsers: '',
    techStack: ''
  });

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.targetUsers || !formData.techStack) {
      return toast.error('Please fill all fields for accurate feedback.');
    }

    try {
      setAnalyzing(true);
      const res = await axios.post(`/ai/validate-idea/${teamId}`, formData);
      setResult(res.data?.data || res.data);
      toast.success('Idea validated!');
    } catch (error) {
      toast.error('Failed to validate idea');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setFormData({ title: '', description: '', targetUsers: '', techStack: '' });
  };

  const getVerdictStyle = (verdict) => {
    if (verdict?.includes('Ship')) return 'bg-success text-white';
    if (verdict?.includes('Work')) return 'bg-warning text-white';
    return 'bg-danger text-white'; // Pivot
  };

  const getRatingBadge = (rating) => {
    if (rating === 'Good') return 'bg-success/20 text-success border-success/30';
    if (rating === 'Ok') return 'bg-warning/20 text-warning border-warning/30';
    return 'bg-danger/20 text-danger border-danger/30'; // Weak
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to={`/teams/${teamId}`} className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors mb-6">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Team
      </Link>

      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-black text-text-primary mb-3 flex items-center justify-center gap-3">
          Idea Validator <FireIcon className="w-10 h-10 text-danger" />
        </h1>
        <p className="text-text-muted text-lg">Get brutally honest, data-driven feedback from Gemini AI before writing a single line of code.</p>
      </div>

      {!result && !analyzing && (
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleValidate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Idea Title</label>
              <input 
                type="text" 
                required 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. ProvenStack: AI Hackathon Teammate Finder"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">How does it work? (The Core Loop)</label>
              <textarea 
                required 
                rows={4}
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder="What problem does it solve? How do users interact with it?"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Target Users</label>
                <input 
                  type="text" 
                  required 
                  value={formData.targetUsers} 
                  onChange={e => setFormData({...formData, targetUsers: e.target.value})} 
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. College hackers, indie devs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Planned Tech Stack</label>
                <input 
                  type="text" 
                  required 
                  value={formData.techStack} 
                  onChange={e => setFormData({...formData, techStack: e.target.value})} 
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. React, Node.js, Gemini API"
                />
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" className="w-full py-4 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                Validate My Idea 🚀
              </button>
            </div>
          </form>
        </div>
      )}

      {analyzing && (
        <div className="bg-card border border-border rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="relative mb-8">
            <FireIcon className="w-20 h-20 text-danger animate-pulse" />
            <SparklesIcon className="w-8 h-8 text-primary absolute -top-2 -right-2 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">Gemini is roasting your idea...</h2>
          <p className="text-text-muted max-w-sm">Checking market saturation, technical feasibility, and problem-solution fit. Brace yourself.</p>
        </div>
      )}

      {result && !analyzing && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
            {/* Verdict Banner */}
            <div className={`p-6 text-center ${getVerdictStyle(result.verdict)}`}>
              <h2 className="text-3xl font-black uppercase tracking-widest">{result.verdict}</h2>
            </div>
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-8 pb-8 border-b border-border">
                <div>
                  <h3 className="text-2xl font-bold text-text-primary mb-1">{formData.title}</h3>
                  <p className="text-sm text-text-muted">Target: {formData.targetUsers}</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-text-primary">{result.overallScore}</span>
                  <span className="text-text-muted">/10</span>
                </div>
              </div>

              {/* One Line Summary */}
              <div className="bg-main border-l-4 border-primary p-6 rounded-r-xl mb-10">
                <p className="text-lg text-text-primary font-medium italic">"{result.oneLineSummary}"</p>
              </div>

              {/* Evaluation Rows */}
              <div className="space-y-4 mb-10">
                {result.evaluations?.map((ev, i) => (
                  <div key={i} className="bg-input/50 border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="sm:w-1/4 shrink-0 flex items-center justify-between sm:block">
                      <p className="font-bold text-text-primary text-sm uppercase tracking-wider">{ev.label}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border sm:mt-2 inline-block ${getRatingBadge(ev.rating)}`}>
                        {ev.rating}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted flex-1 leading-relaxed">
                      {ev.comment}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-border">
                <button onClick={resetForm} className="flex-1 py-3 bg-input border border-border text-text-primary hover:bg-input/80 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                  <ArrowPathIcon className="w-5 h-5" /> Validate Another Idea
                </button>
                <button onClick={() => {
                  navigator.clipboard.writeText(`Idea: ${formData.title}\nVerdict: ${result.verdict}\nScore: ${result.overallScore}/10\nSummary: ${result.oneLineSummary}`);
                  toast.success('Copied to clipboard!');
                }} className="flex-1 py-3 bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                  <LightBulbIcon className="w-5 h-5" /> Copy Summary to Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaValidator;
