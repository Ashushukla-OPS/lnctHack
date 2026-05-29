import React, { useState } from "react";

/**
 * MeetScheduleModal component.
 * Allows team leaders to schedule video meetings.
 */
export const MeetScheduleModal = ({ isOpen, onClose, onScheduleSubmit }) => {
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("60");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) {
      setError("Please fill out all fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onScheduleSubmit({
        title: title.trim(),
        scheduledAt,
        duration: Number(duration),
      });
      setTitle("");
      setScheduledAt("");
      setDuration("60");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to schedule meet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <h3 className="text-xl font-bold text-white tracking-wide">Schedule Video Meet</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Meet Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Brainstorming Session / Code Review"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-4 py-3 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            >
              <option value="30">30 minutes</option>
              <option value="60">60 minutes (1 hour)</option>
              <option value="90">90 minutes</option>
              <option value="120">120 minutes (2 hours)</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg text-sm font-semibold transition-all duration-205 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all duration-205 flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scheduling...
                </>
              ) : (
                "Schedule Meet"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetScheduleModal;
