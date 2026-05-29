const Team = require("../models/team.model");
const User = require("../models/user.model");
const ApiError = require("../utils/apiError");
const { generateTeamChemistry } = require("./geminiService");

const generateTeamChemistryService = async (teamId, userId) => {
  // 1. Fetch team
  const team = await Team.findById(teamId);
  if (!team) throw new ApiError(404, "Team not found");

  // Check if requesting user is a member of the team or the leader
  const isMember = team.members.some((m) => m.userId.toString() === userId.toString()) || team.leader.toString() === userId.toString();
  if (!isMember) {
    throw new ApiError(403, "You are not authorized to view this team's chemistry");
  }

  if (team.members.length < 2) {
    throw new ApiError(400, "Team must have at least 2 members to analyze chemistry");
  }

  // Check cache (1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (team.chemistryUpdatedAt && team.chemistryUpdatedAt > oneHourAgo && team.chemistryData) {
    return {
      teamId: team._id,
      teamName: team.teamName,
      memberCount: team.members.length,
      ...team.chemistryData,
      generatedAt: team.chemistryUpdatedAt
    };
  }

  // 2. Fetch members and build profiles
  const memberIds = team.members.map((m) => m.userId);
  if (!memberIds.some((id) => id.toString() === team.leader.toString())) {
    memberIds.push(team.leader);
  }
  
  const users = await User.find({ _id: { $in: memberIds } });

  const memberProfilesStr = users.map((u) => {
    const isLeader = team.leader.toString() === u._id.toString();
    const memberRole = team.members.find(m => m.userId.toString() === u._id.toString())?.role || (isLeader ? "Leader" : "Member");
    return `Name: ${u.name}
Role: ${memberRole}
Tier: ${u.tier || "Beginner"}
Top Languages/Skills: ${u.skills?.slice(0, 5).join(", ") || "None"}
LeetCode Score: ${u.scores?.leetcode || 0}
Codeforces Score: ${u.scores?.cf || 0}
Deployed Projects: ${u.scores?.projects || 0}
Reputation Score: ${u.reputationScore || 0}
---`;
  }).join("\n");

  // 3. Call Gemini
  const chemistryData = await generateTeamChemistry(team.teamName, memberProfilesStr);

  // 4. Save to team
  team.chemistryScore = chemistryData.chemistryScore || 0;
  team.chemistryNote = chemistryData.suggestion || "";
  team.chemistryData = chemistryData;
  team.chemistryUpdatedAt = new Date();
  await team.save();

  // 5. Return
  return {
    teamId: team._id,
    teamName: team.teamName,
    memberCount: team.members.length,
    ...chemistryData,
    generatedAt: team.chemistryUpdatedAt
  };
};

module.exports = {
  generateTeamChemistryService
};
