import React from "react";

/**
 * MeetListCard component.
 * Displays scheduled/live/ended meetings for the team with dynamic action buttons depending on leader/member credentials.
 */
export const MeetListCard = ({ meet, isLeader, onStartMeet, onJoinMeet, onCancelMeet }) => {
  const { _id, title, scheduledAt, duration, status, roomId } = meet;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = () => {
    switch (status) {
      case "live":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            LIVE NOW
          </span>
        );
      case "ended":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-800 border border-slate-700 text-slate-400">
            ENDED
          </span>
        );
      case "scheduled":
      default:
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            SCHEDULED
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-slate-900/50 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h4 className="text-lg font-bold text-white tracking-wide">{title}</h4>
          {getStatusBadge()}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(scheduledAt)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{duration} minutes</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end md:self-center">
        {/* Leader options when scheduled */}
        {isLeader && status === "scheduled" && (
          <>
            <button
              onClick={() => onCancelMeet(_id)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 rounded-lg text-sm font-semibold border border-rose-500/10 hover:border-rose-500/30 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => onStartMeet(roomId)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-600/15 transition-all duration-200"
            >
              Start Meet
            </button>
          </>
        )}

        {/* Action button to join live meeting */}
        {status === "live" && (
          <button
            onClick={() => onJoinMeet(roomId)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all duration-200 animate-pulse"
          >
            Join Meet
          </button>
        )}

        {/* History indicator */}
        {status === "ended" && (
          <span className="text-xs text-slate-500 italic">No actions available</span>
        )}
      </div>
    </div>
  );
};

export default MeetListCard;
