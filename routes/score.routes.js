const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");

const {
  scanScoreController,
  getMyScoreController,
  getUserScoreController,
  getLeaderboardController,
} = require("../controllers/score.controller");

const router = express.Router();


// SCAN / UPDATE SCORE
router.post(
  "/scan",
  authMiddleware,
  scanScoreController
);


// GET MY SCORE
router.get(
  "/my-score",
  authMiddleware,
  getMyScoreController
);


// GET USER SCORE
router.get(
  "/:userId",
  authMiddleware,
  getUserScoreController
);


// LEADERBOARD
router.get(
  "/leaderboard/all",
  authMiddleware,
  getLeaderboardController
);


module.exports = router;