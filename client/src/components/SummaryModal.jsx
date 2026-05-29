import React, { useState } from "react";

/**
 * SummaryModal component.
 * Displays dynamic markdown or parsed numbered lists from Gemini in an immersive full-screen panel.
 */
export const SummaryModal = ({
  isOpen,
  onClose,
  type,
  teamId,
  isLeader,
  summaryData,
  setSummaryData,
}) => {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleRegenerate = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/summary/${teamId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summaryType: `${type}_summary` }), // handles matching project_summary / new_member_brief / progress_report
      });

      // Handle correct body types mapping
      let bodyType = `${type}_summary`;
      if (type === "project") bodyType = "project_summary";
      else if (type === "new_member") bodyType = "new_member_brief";
      else if (type === "progress") bodyType = "progress_report";

      const res2 = await fetch(`/api/summary/${teamId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summaryType: bodyType }),
      });
      
      const data = await res2.json();
      if (!res2.ok) {
        throw new Error(data.message || "Failed to regenerate summary");
      }

      setSummaryData(data.data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not regenerate. Rate limits might apply.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summaryData.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to parse numbered lists from Gemini and render them as beautiful individual cards
  const parseNumberedList = (text) => {
    // Matches blocks starting with digits followed by dot (e.g. "1. " or "2. ")
    const regex = /(\d+\.\s+[^]*?)(?=\n\d+\.\s+|$)/g;
    const matches = text.match(regex);

    if (!matches || matches.length === 0) {
      // Fallback: split by newlines if no regex match
      return <div className="text-slate-300 whitespace-pre-line text-base leading-relaxed leading-7">{text}</div>;
    }

    const cardIcons = ["💡", "🛠️", "🚀", "⚠️", "🎯", "📊"];

    return (
      <div className="grid gap-6 md:grid-cols-2">
        {matches.map((item, index) => {
          const splitIndex = item.indexOf("\n");
          let title = item.substring(0, splitIndex !== -1 ? splitIndex : item.length);
          let body = splitIndex !== -1 ? item.substring(splitIndex) : "";

          // Clean title number prefix
          title = title.replace(/^\d+\.\s*/, "").replace(/\*\*|#/g, "");

          return (
            <div
              key={index}
              className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 shadow-lg flex gap-4 hover:border-slate-700/80 transition-all duration-200"
            >
              <div className="text-2xl h-10 w-10 bg-slate-950/60 rounded-lg flex items-center justify-center border border-slate-800 shrink-0">
                {cardIcons[index % cardIcons.length]}
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white tracking-wide">{title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">{body.trim()}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070a13] text-white flex flex-col overflow-y-auto animate-fade-in">
      
      {/* Warning Banner for Stale Summaries */}
      {summaryData.isStale && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 px-6 py-3 text-xs md:text-sm font-semibold flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <span>⚠️</span>
            <span>Chat activity has increased since this was generated. The information might be outdated.</span>
          </span>
          {isLeader && (
            <button
              onClick={handleRegenerate}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-xs font-bold transition-all duration-200 shrink-0"
            >
              Regenerate
            </button>
          )}
        </div>
      )}

      {/* Main Header */}
      <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center text-lg font-bold border border-indigo-500/20">
            🤖
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-wide flex items-center gap-2">
              Gemini AI Project Assistant
              {summaryData.freshlyGenerated ? (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                  NEW
                </span>
              ) : (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-semibold">
                  CACHED
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-500">
              Generated {new Date(summaryData.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isLeader && (
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {loading ? "Reading chat..." : "Regenerate"}
            </button>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm font-bold bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg border border-slate-850 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative flex h-10 w-10">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-10 w-10 bg-indigo-500 border border-indigo-400 flex items-center justify-center text-lg">
                🤖
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Gemini is processing your team chat...</h3>
              <p className="text-xs text-slate-500">Reading historical context and structure</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-up">
            
            {/* Parsed Gemini Cards */}
            {parseNumberedList(summaryData.summary)}

            {/* Task Snapshot sidebar inside Modal if New Member Brief requested */}
            {type === "new_member" && summaryData.tasks && (
              <div className="mt-8 pt-8 border-t border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span>📋</span> Team Task Board Snapshot
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {summaryData.tasks.map((task) => (
                    <div
                      key={task._id}
                      className="p-3.5 bg-slate-950 border border-slate-900 rounded-lg text-xs flex flex-col justify-between gap-2"
                    >
                      <span className="font-semibold text-slate-200 truncate">{task.title}</span>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            task.status === "done"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : task.status === "inprogress"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-indigo-500/10 text-indigo-400"
                          }`}
                        >
                          {task.status.toUpperCase()}
                        </span>
                        <span className="text-slate-500 truncate">
                          @{task.assignedTo?.name || "Unassigned"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="px-6 py-5 border-t border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <span className="text-xs text-slate-500">
          Powered by Google Gemini 1.5 Flash • Summarised up to {summaryData.messageCountAt || 0} messages
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={copyToClipboard}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/15 transition-all duration-200 flex items-center gap-2"
          >
            <span>{copied ? "✔️" : "📋"}</span>
            <span>{copied ? "Copied!" : "Copy Summary"}</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg text-sm font-semibold transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
