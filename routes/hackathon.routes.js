const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");

const {
  createHackathonController,
  getAllHackathonsController,
  getSingleHackathonController,
  registerHackathonController,
  deleteHackathonController,
  getHackathonTimerController,
} = require("../controllers/hackathon.controller");

const router = express.Router();

// CREATE HACKATHON
router.post("/create", authMiddleware, createHackathonController);

// GET ALL HACKATHONS
router.get("/", authMiddleware, getAllHackathonsController);

// GET COUNTDOWN TIMER (declared before GET /:hackathonId to avoid conflict)
router.get("/:hackathonId/timer", authMiddleware, getHackathonTimerController);

// GET SINGLE HACKATHON
router.get("/:hackathonId", authMiddleware, getSingleHackathonController);

// REGISTER IN HACKATHON
router.patch(
  "/register/:hackathonId",
  authMiddleware,
  registerHackathonController,
);

// DELETE HACKATHON
router.delete("/:hackathonId", authMiddleware, deleteHackathonController);

module.exports = router;
