const ScoreModel = require("../models/score.model");

const ApiError = require("../utils/apiError");

// SCAN / UPDATE SCORE
let scanScoreService = async (userId, data) => {
  let { githubData, leetcodeData, cfData, deployedProjects } = data;

  // ===== SCORE CALCULATIONS =====

  let githubScore =
    (githubData?.repos || 0) * 2 +
    (githubData?.stars || 0) * 3 +
    (githubData?.prs || 0) * 5;

  let leetcodeScore =
    (leetcodeData?.solved || 0) * 2 + (leetcodeData?.hardSolved || 0) * 10;

  let cfScore = cfData?.rating || 0;

  let projectsScore = (deployedProjects?.length || 0) * 20;

  // TOTAL SCORE
  let totalScore = githubScore + leetcodeScore + cfScore + projectsScore;

  // ===== TIER =====

  let tier = "Beginner";

  if (totalScore > 3000) {
    tier = "Elite";
  } else if (totalScore > 2000) {
    tier = "ProBuilder";
  } else if (totalScore > 1000) {
    tier = "Builder";
  }

  // ===== ROLE SCORES =====

  let roleScores = {
    frontend: githubScore * 0.3,
    backend: githubScore * 0.3,
    fullstack: githubScore * 0.4,
    dsa: leetcodeScore + cfScore,
    ai: githubScore * 0.2,
    design: 0,
  };

  // ===== UPSERT =====

  let score = await ScoreModel.findOneAndUpdate(
    { userId },

    {
      githubData,
      leetcodeData,
      cfData,
      deployedProjects,

      roleScores,

      totalScore,

      tier,

      lastScanAt: new Date(),

      $push: {
        scanHistory: {
          totalScore,
          githubScore,
          leetcodeScore,
          cfScore,
          projectsScore,
        },
      },
    },

    {
      new: true,
      upsert: true,
    },
  );

  return score;
};

// GET MY SCORE
let getMyScoreService = async (userId) => {
  let score = await ScoreModel.findOne({ userId })

    .populate("userId", "name email tier");

  if (!score) {
    throw new ApiError(404, "Score not found");
  }

  return score;
};

// GET USER SCORE
let getUserScoreService = async (userId) => {
  let score = await ScoreModel.findOne({ userId })

    .populate("userId", "name email tier");

  if (!score) {
    throw new ApiError(404, "Score not found");
  }

  return score;
};

// LEADERBOARD
let getLeaderboardService = async () => {
  let users = await ScoreModel.find()

    .sort({ totalScore: -1 })

    .limit(50)

    .populate("userId", "name email tier");

  return users;
};

module.exports = {
  scanScoreService,
  getMyScoreService,
  getUserScoreService,
  getLeaderboardService,
};
