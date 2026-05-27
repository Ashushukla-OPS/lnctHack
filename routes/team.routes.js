const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");

const {
  createTeamController,
  getAllTeamsController,
  getSingleTeamController,
  deleteTeamController,
} = require("../controllers/team.controller");

const router = express.Router();

// Create team
router.post(
  "/create",
  authMiddleware,
  createTeamController
);

// Get all teams
router.get(
  "/",
  authMiddleware,
  getAllTeamsController
);

// Get single team
router.get(
  "/:id",
  authMiddleware,
  getSingleTeamController
);

// Delete team
router.delete(
  "/:id",
  authMiddleware,
  deleteTeamController
);

module.exports = router;