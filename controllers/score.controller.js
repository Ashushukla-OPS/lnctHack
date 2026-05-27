const asyncHandler = require("../utils/asyncHandler");

const {
  scanScoreService,
  getMyScoreService,
  getUserScoreService,
  getLeaderboardService,
} = require("../services/score.services");




// SCAN SCORE
let scanScoreController = asyncHandler(
  async (req, res) => {

    let score = await scanScoreService(
      req.user._id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Score updated successfully",
      score,
    });
  }
);




// GET MY SCORE
let getMyScoreController = asyncHandler(
  async (req, res) => {

    let score = await getMyScoreService(
      req.user._id
    );

    return res.status(200).json({
      success: true,
      score,
    });
  }
);




// GET USER SCORE
let getUserScoreController = asyncHandler(
  async (req, res) => {

    let score = await getUserScoreService(
      req.params.userId
    );

    return res.status(200).json({
      success: true,
      score,
    });
  }
);




// LEADERBOARD
let getLeaderboardController =
  asyncHandler(async (req, res) => {

    let users = await getLeaderboardService();

    return res.status(200).json({
      success: true,
      totalUsers: users.length,
      users,
    });
  });




module.exports = {
  scanScoreController,
  getMyScoreController,
  getUserScoreController,
  getLeaderboardController,
};