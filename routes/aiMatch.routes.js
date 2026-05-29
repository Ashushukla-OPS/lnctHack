const express = require("express");
const { 
  getAiMatchesController, 
  getAiChemistryController, 
  getAiSkillGapController,
  getAiIdeaValidationController 
} = require("../controllers/aiMatch.controller");
const authMiddleware = require("../middleware/auth.middleware");
const isTeamLeader = require("../middleware/isTeamLeader");
const isTeamMember = require("../middleware/isTeamMember");

const router = express.Router();

// GET /api/ai/match/:teamId
router.get("/match/:teamId", authMiddleware, isTeamLeader, getAiMatchesController);

// GET /api/ai/chemistry/:teamId
router.get("/chemistry/:teamId", authMiddleware, getAiChemistryController);

// GET /api/ai/skill-gap/:teamId
router.get("/skill-gap/:teamId", authMiddleware, getAiSkillGapController);

// POST /api/ai/validate-idea/:teamId
router.post("/validate-idea/:teamId", authMiddleware, isTeamMember, getAiIdeaValidationController);

module.exports = router;
