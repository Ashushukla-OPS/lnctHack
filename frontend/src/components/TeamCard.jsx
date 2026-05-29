import React from 'react';

const TeamCard = ({ team, isApplied, isMember, onInterest }) => {
  if (!team) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-text-primary">{team.name}</h3>
          {team.hackathon && (
            <p className="text-sm text-text-muted mt-1">{team.hackathon.name}</p>
          )}
        </div>
        {team.chemistryScore && (
          <div className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 border border-primary/20">
            {team.chemistryScore.score}/100 🧪
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm text-text-primary mb-2 flex items-center justify-between">
          <span className="text-text-muted">Members</span>
          <span>{team.members?.length || 0} / {(team.members?.length || 0) + (team.openSlots?.length || 0)}</span>
        </p>
        <p className="text-sm text-text-primary mb-2 flex items-center justify-between">
          <span className="text-text-muted">Location</span>
          <span>{team.isRemote ? 'Remote' : (team.location || 'Not specified')}</span>
        </p>
      </div>

      <div className="flex-1">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Open Slots</h4>
        {team.openSlots && team.openSlots.length > 0 ? (
          <div className="space-y-3">
            {team.openSlots.map((slot, idx) => (
              <div key={idx} className="bg-input/50 p-3 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-text-primary">{slot.role}</span>
                  <span className="text-xs text-warning flex items-center gap-1">⭐ Min {slot.minScore || 0}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {slot.requiredSkills?.map((skill, sIdx) => (
                    <span key={sIdx} className="text-[10px] bg-card border border-border px-1.5 py-0.5 rounded text-text-muted">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic">No open slots</p>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-border mt-auto">
        <button
          onClick={() => onInterest(team)}
          disabled={isApplied || isMember}
          className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
            isMember
              ? 'bg-success/20 text-success border border-success/30 cursor-not-allowed'
              : isApplied
              ? 'bg-input text-text-muted cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {isMember ? 'Member' : isApplied ? 'Already Applied' : "I'm Interested"}
        </button>
      </div>
    </div>
  );
};

export default TeamCard;
