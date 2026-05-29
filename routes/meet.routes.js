const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const isTeamMember = require("../middleware/isTeamMember");
const {
  scheduleMeet,
  getTeamMeets,
  getMeetRoom,
  startMeet,
  endMeet,
  deleteMeet,
} = require("../controllers/meetController");

const router = express.Router();

// Schedule a meeting (Leader only checked inside controller, membership secured by middleware)
router.post("/schedule/:teamId", authMiddleware, isTeamMember, scheduleMeet);

// Get all meetings for a team
router.get("/:teamId", authMiddleware, isTeamMember, getTeamMeets);

// Get a single meeting room (Verifies user is a member of the corresponding team inside controller)
router.get("/room/:roomId", authMiddleware, getMeetRoom);

// Start meeting (Leader only check inside controller)
router.patch("/start/:roomId", authMiddleware, startMeet);

// End meeting (Leader only check inside controller)
router.patch("/end/:roomId", authMiddleware, endMeet);

// Delete/Cancel meeting (Leader only check inside controller)
router.delete("/:meetId", authMiddleware, deleteMeet);

module.exports = router;
