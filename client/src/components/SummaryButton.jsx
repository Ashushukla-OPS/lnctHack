import React, { useState, useEffect } from "react";
import SummaryModal from "./SummaryModal";

/**
 * SummaryButton component.
 * Allows members to fetch project summaries, onboarding briefs, or progress reports.
 */
export const SummaryButton = ({ type, teamId, isLeader, memberJoinedAt }) => {
  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'loaded' | 'stale'
  const [summaryData, setSummaryData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewMember, setIsNewMember] = useState(false);

  useEffect(() => {
    if (type === "new_member" && memberJoinedAt) {
      const joinTime = new Date(memberJoinedAt).getTime();
      const timeElapsed = Date.now() - joinTime;
      setIsNewMember(timeElapsed <= 24 * 60 * 60 * 1000);
    }
  }, [type, memberJoinedAt]);

  // Don't show new member onboarding if they joined > 24 hours ago
  if (type === "new_member" && !isNewMember) return null;

  // Don't show progress report button if not leader
  if (type === "progress" && !isLeader) return null;

  const getButtonText = () => {
    switch (type) {
      case "new_member":
        return "Explain Project to Me";
      case "progress":
        return "Get Progress Report";
      case "project":
      default:
        return "Get Project Summary";
    }
  };

  const getButtonIcon = () => {
    switch (type) {
      case "new_member":
        return "👋";
      case "progress":
        return "📈";
      case "project":
      default:
        return "🤖";
    }
  };

  const fetchSummary = async () => {
    try {
      setStatus("loading");
      const res = await fetch(`/api/summary/${teamId}/${type}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch summary");
      }

      setSummaryData(data.data);
      setStatus(data.data.isStale ? "stale" : "loaded");
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not retrieve summary. Please try again.");
      setStatus("idle");
    }
  };

  return (
    <>
      <button
        onClick={fetchSummary}
        disabled={status === "loading"}
        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
          status === "loading"
            ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
            : type === "progress"
            ? "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/15"
            : type === "new_member"
            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/15 animate-bounce"
            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/15"
        }`}
      >
        <span>{getButtonIcon()}</span>
        <span>{status === "loading" ? "Gemini is reading chat..." : getButtonText()}</span>

        {/* Yellow dot indicating stale data */}
        {status === "stale" && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-yellow-500 border border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-950">
              !
            </span>
          </span>
        )}
      </button>

      {summaryData && (
        <SummaryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setStatus(summaryData.isStale ? "stale" : "loaded");
          }}
          type={type}
          teamId={teamId}
          isLeader={isLeader}
          summaryData={summaryData}
          setSummaryData={setSummaryData}
        />
      )}
    </>
  );
};

export default SummaryButton;
