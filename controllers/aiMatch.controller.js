const MatchCache = require("../models/MatchCache");
const { generateMatchDataService } = require("../services/aiMatch.service");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");

const getAiMatchesController = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  // 1. Check Cache First
  let cachedMatch = await MatchCache.findOne({ teamId });
  if (cachedMatch) {
    return res.status(200).json(
      new ApiResponse("Team matches fetched successfully from cache", {
        teamId,
        openSlots: cachedMatch.openSlots,
        matches: cachedMatch.matches,
        generatedAt: cachedMatch.generatedAt,
      })
    );
  }

  // 2. Generate new matches if not cached
  const result = await generateMatchDataService(teamId);

  // 3. Save to MatchCache collection (expires automatically after 30 mins via TTL)
  const newCache = await MatchCache.create({
    teamId,
    openSlots: result.openSlots,
    matches: result.matches,
  });

  // 4. Return Final Data
  return res.status(200).json(
    new ApiResponse("Team matches generated successfully", {
      teamId,
      openSlots: newCache.openSlots,
      matches: newCache.matches,
      generatedAt: newCache.generatedAt,
    })
  );
});

const { generateTeamChemistryService } = require("../services/aiChemistry.service");
const { generateTeamSkillGapService } = require("../services/aiSkillGap.service");

const getAiChemistryController = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const result = await generateTeamChemistryService(teamId, req.user._id);
  return res.status(200).json(new ApiResponse("Team chemistry analyzed successfully", result));
});

const getAiSkillGapController = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const result = await generateTeamSkillGapService(teamId, req.user._id);
  return res.status(200).json(new ApiResponse("Team skill gap analyzed successfully", result));
});

module.exports = {
  getAiMatchesController,
  getAiChemistryController,
  getAiSkillGapController,
};
