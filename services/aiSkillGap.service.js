const Team = require("../models/team.model");
const User = require("../models/user.model");
const ApiError = require("../utils/apiError");
const { generateTeamSkillGap } = require("./geminiService");

const generateTeamSkillGapService = async (teamId, userId) => {
  // 1. Fetch team
  const team = await Team.findById(teamId);
  if (!team) throw new ApiError(404, "Team not found");

  // Authorization check: User must be a member or leader
  const isMember = team.members.some((m) => m.userId.toString() === userId.toString()) || team.leader.toString() === userId.toString();
  if (!isMember) {
    throw new ApiError(403, "You are not authorized to view this team's skill gap");
  }

  // 2. Cache Check (2 Hours)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  if (team.skillGapUpdatedAt && team.skillGapUpdatedAt > twoHoursAgo && team.skillGapData) {
    return {
      teamId: team._id,
      currentSkills: team.skillGapData.currentSkills || [],
      criticalGaps: team.skillGapData.criticalGaps || [],
      niceToHave: team.skillGapData.niceToHave || [],
      recommendation: team.skillGapData.recommendation || "",
      resources: team.skillGapData.resources || [],
      generatedAt: team.skillGapUpdatedAt
    };
  }

  // 3. Gather current member skills
  const memberIds = team.members.map((m) => m.userId);
  if (!memberIds.some((id) => id.toString() === team.leader.toString())) {
    memberIds.push(team.leader);
  }
  const users = await User.find({ _id: { $in: memberIds } });
  const currentSkills = [...new Set(users.flatMap((u) => u.skills || []))];

  // 4. Gather required skills from unfilled open slots
  const requiredSkillsFromSlots = [...new Set(
    team.openSlots
      .filter((s) => !s.filled)
      .flatMap((s) => s.requiredSkills || [])
  )];

  // 5. Send to Gemini
  const currentSkillsStr = currentSkills.join(", ") || "None";
  const requiredSkillsStr = requiredSkillsFromSlots.join(", ") || "None";

  const skillGapResult = await generateTeamSkillGap(currentSkillsStr, requiredSkillsStr);

  // 6. Save results to Team document
  const skillGapData = {
    currentSkills,
    criticalGaps: skillGapResult.criticalGaps || [],
    niceToHave: skillGapResult.niceToHave || [],
    recommendation: skillGapResult.recommendation || "",
    resources: skillGapResult.resources || []
  };

  team.skillGapData = skillGapData;
  team.skillGapUpdatedAt = new Date();
  await team.save();

  // 7. Return Response
  return {
    teamId: team._id,
    ...skillGapData,
    generatedAt: team.skillGapUpdatedAt
  };
};

module.exports = {
  generateTeamSkillGapService
};
