const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const isTeamMember = require("../middleware/isTeamMember");
const {
  getProjectSummary,
  getNewMemberBrief,
  getProgressReport,
  regenerateSummary,
  getSummaryHistory,
} = require("../controllers/chatSummaryController");

const router = express.Router();

// Get project summary (all members)
router.get("/:teamId/project", authMiddleware, isTeamMember, getProjectSummary);

// Get onboarding brief for new members (joined within last 24h)
router.get("/:teamId/new-member", authMiddleware, isTeamMember, getNewMemberBrief);

// Get progress reports (leader only check inside controller)
router.get("/:teamId/progress", authMiddleware, isTeamMember, getProgressReport);

// Force manual regeneration of summaries (leader only check inside controller)
router.post("/:teamId/regenerate", authMiddleware, isTeamMember, regenerateSummary);

// Get history of all saved summaries for a team (all members)
router.get("/:teamId/history", authMiddleware, isTeamMember, getSummaryHistory);

module.exports = router;
