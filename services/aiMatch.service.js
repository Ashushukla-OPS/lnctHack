const Team = require("../models/team.model");
const Hackathon = require("../models/hackathon.model");
const User = require("../models/user.model");
const JoinRequest = require("../models/JoinRequest");
const ApiError = require("../utils/apiError");
const { generateTeamMatches } = require("./geminiService");

const generateMatchDataService = async (teamId) => {
  // 1. Fetch team + open slots
  const team = await Team.findById(teamId).populate("openSlots");
  if (!team) throw new ApiError(404, "Team not found");

  const openSlots = team.openSlots || [];
  if (openSlots.length === 0) {
    throw new ApiError(400, "No open slots to fill");
  }

  // Flatten all required skills from all open slots
  const requiredSkills = new Set();
  openSlots.forEach((slot) => {
    if (slot.requiredSkills) {
      slot.requiredSkills.forEach((skill) => requiredSkills.add(skill.toLowerCase()));
    }
  });
  const teamSkills = Array.from(requiredSkills);
  const openSlotsStr = openSlots.map((s) => `${s.role} (${s.requiredSkills?.join(", ")})`).join("; ");

  // 2. Fetch hackathon location (if applicable)
  let hackathonLocation = "Any (Remote)";
  let targetLocation = "";
  if (team.hackathon) {
    const hackathon = await Hackathon.findById(team.hackathon);
    if (hackathon && hackathon.location) {
      hackathonLocation = hackathon.location;
      targetLocation = hackathon.location.toLowerCase();
    }
  }

  // 3. Find candidates
  // Exclude current members
  const memberIds = team.members.map((m) => m.userId.toString());

  // Find all pending requests to this team to exclude them
  const pendingRequests = await JoinRequest.find({ team: teamId, status: "pending" });
  const pendingSenderIds = pendingRequests.map((r) => r.sender.toString());

  const excludedUserIds = [...memberIds, ...pendingSenderIds];

  const candidates = await User.find({
    isOpenToTeam: true,
    isBlacklisted: false,
    _id: { $nin: excludedUserIds }
  });

  if (candidates.length === 0) {
    return { openSlots, matches: [] };
  }

  // 4. Calculate weighted score (0-100)
  const scoredCandidates = candidates.map((user) => {
    // A. Skill match (35%)
    let skillMatchScore = 0;
    if (teamSkills.length > 0 && user.skills && user.skills.length > 0) {
      const userSkills = user.skills.map((s) => s.toLowerCase());
      const matchedSkills = userSkills.filter((s) => teamSkills.includes(s));
      skillMatchScore = (matchedSkills.length / teamSkills.length) * 35;
      if (skillMatchScore > 35) skillMatchScore = 35;
    }

    // B. Location match (30%)
    let locationMatchScore = 0;
    if (targetLocation && user.location) {
      if (user.location.toLowerCase().includes(targetLocation) || targetLocation.includes(user.location.toLowerCase())) {
        locationMatchScore = 30;
      }
    } else if (!targetLocation) {
      // If hackathon is remote/no location, location match is neutral (give full points or partial to not penalize)
      locationMatchScore = 30;
    }

    // C. Past completions (20%)
    // totalTeamsJoined - totalDropouts
    let completionRateScore = 0;
    const joined = user.totalTeamsJoined || 0;
    const dropouts = user.totalDropouts || 0;
    
    if (joined === 0) {
      completionRateScore = 10; // Neutral for new users
    } else {
      const rate = Math.max(0, (joined - dropouts) / joined);
      completionRateScore = rate * 20;
    }

    // D. Availability (15%)
    // Since isOpenToTeam is true for all these users, base this on availability string
    let availabilityScore = 15;
    if (user.availability === "busy" || user.availability === "not_available") {
      availabilityScore = 0;
    } else if (user.availability === "weekends") {
      availabilityScore = 10;
    }

    const totalScore = Math.round(skillMatchScore + locationMatchScore + completionRateScore + availabilityScore);

    return {
      user,
      totalScore,
      breakdown: {
        skillMatch: Math.round(skillMatchScore),
        locationMatch: Math.round(locationMatchScore),
        completionRate: Math.round(completionRateScore),
        availability: Math.round(availabilityScore)
      }
    };
  });

  // 5. Sort by score descending
  scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);

  // 6. Take top 10 candidates
  const topCandidates = scoredCandidates.slice(0, 10);

  if (topCandidates.length === 0) {
    return { openSlots, matches: [] };
  }

  // 7. Format string for Gemini
  const candidatesStr = topCandidates.map((c) => {
    const u = c.user;
    return `ID: ${u._id}
Name: ${u.name}
Algorithmic Score: ${c.totalScore}/100
Tier: ${u.tier}
Location: ${u.location || "N/A"}
Top Languages/Skills: ${u.skills?.slice(0, 5).join(", ") || "None"}
LeetCode Score: ${u.scores?.leetcode || 0}
Deployed Projects: ${u.scores?.projects || 0}
Reputation Score: ${u.reputationScore || 0}
Completion Rate Score: ${c.breakdown.completionRate}/20
---`;
  }).join("\n");

  // 8. Call Gemini
  const geminiInsights = await generateTeamMatches(openSlotsStr, hackathonLocation, candidatesStr);

  // 9. Merge algorithm score + Gemini insight per candidate
  const finalMatches = topCandidates.map((c) => {
    const u = c.user;
    // Find gemini insight
    const insight = geminiInsights.find((g) => g.userId === u._id.toString()) || {};

    return {
      userId: u._id,
      name: u.name,
      tier: u.tier || "Beginner",
      totalScore: c.totalScore,
      breakdown: c.breakdown,
      fitRating: insight.fitRating || "Average",
      whyGoodFit: insight.whyGoodFit || "Algorithm found a reasonable match based on skills and location.",
      concern: insight.concern || "None",
      scores: {
        total: u.scores?.total || 0,
        github: u.scores?.github || 0,
        leetcode: u.scores?.leetcode || 0,
        cf: u.scores?.cf || 0
      },
      location: u.location || "",
      topLanguages: u.skills?.slice(0, 5) || []
    };
  });

  return { openSlots, matches: finalMatches };
};

module.exports = {
  generateMatchDataService
};
