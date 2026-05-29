const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");
const isTeamLeader = require("../middleware/isTeamLeader");

const {
  createTeamController,
  getAllTeamsController,
  getSingleTeamController,
  deleteTeamController,
  addSlotController,
  removeSlotController,
  editSlotController,
  leaveTeamController,
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

// Leave team
router.patch(
  "/:id/leave",
  authMiddleware,
  leaveTeamController
);

// Add an open slot (leader only)
router.patch(
  "/:id/slots/add",
  authMiddleware,
  isTeamLeader,
  addSlotController
);

// Remove an open slot (leader only)
router.patch(
  "/:id/slots/remove/:slotId",
  authMiddleware,
  isTeamLeader,
  removeSlotController
);

// Edit an open slot (leader only)
router.patch(
  "/:id/slots/edit/:slotId",
  authMiddleware,
  isTeamLeader,
  editSlotController
);

module.exports = router;