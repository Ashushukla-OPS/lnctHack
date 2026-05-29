import React from 'react';

const TeamCard = ({ team, isApplied, isMember, onInterest }) => {
  if (!team) return null;

  return (
    <div className="glass-card p-5 border border-[#232329] bg-[#141417]/85 backdrop-blur-md shadow-lg rounded-2xl flex flex-col h-full transition-all duration-300">
      
      {/* Title & Chemistry */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">{team.teamName || team.name}</h3>
          {team.hackathon && (
            <p className="text-xs text-text-muted mt-1 font-medium">{team.hackathon.name}</p>
          )}
        </div>
        {team.chemistryScore && (
          <div className="bg-violet-500/10 text-violet-400 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 border border-violet-500/20 shadow-sm">
            <span>{team.chemistryScore.score}/100</span>
            <span>🧪</span>
          </div>
        )}
      </div>

      {/* Roster & Location */}
      <div className="mb-4 space-y-2">
        <p className="text-xs text-text-muted flex items-center justify-between font-medium">
          <span>Members</span>
          <span className="text-white font-semibold">{team.members?.length || 0} / {(team.members?.length || 0) + (team.openSlots?.length || 0)}</span>
        </p>
        <p className="text-xs text-text-muted flex items-center justify-between font-medium">
          <span>Location</span>
          <span className="text-white font-semibold">{team.isRemote ? 'Remote 🌐' : (team.location || 'Not specified')}</span>
        </p>
      </div>

      {/* Open slots list */}
      <div className="flex-1">
        <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Open Slots</h4>
        {team.openSlots && team.openSlots.filter(slot => !(slot.filled || slot.isFilled)).length > 0 ? (
          <div className="space-y-3">
            {team.openSlots.filter(slot => !(slot.filled || slot.isFilled)).map((slot, idx) => (
              <div key={idx} className="bg-[#18181c]/50 p-3 rounded-xl border border-[#232329]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-white">{slot.role}</span>
                  <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">⭐ Min {slot.minScore || 0}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {slot.requiredSkills?.map((skill, sIdx) => (
                    <span key={sIdx} className="text-[9px] bg-[#101012] border border-[#232329] px-2 py-0.5 rounded-full text-violet-300 font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted italic">No open slots available.</p>
        )}
      </div>

      {/* Bottom Action */}
      <div className="mt-6 pt-4 border-t border-[#232329] mt-auto">
        {isMember ? (
          <button
            disabled
            className="w-full py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-lg text-sm font-semibold cursor-not-allowed select-none text-center"
          >
            Member
          </button>
        ) : isApplied ? (
          <button
            disabled
            className="w-full py-2 bg-[#18181c] text-text-muted border border-[#232329] rounded-lg text-sm font-semibold cursor-not-allowed select-none text-center"
          >
            Already Applied
          </button>
        ) : (
          <button
            onClick={() => onInterest(team)}
            className="w-full btn-primary py-2 text-sm font-semibold rounded-lg shadow-md"
          >
            I'm Interested
          </button>
        )}
      </div>
    </div>
  );
};

export default TeamCard;
