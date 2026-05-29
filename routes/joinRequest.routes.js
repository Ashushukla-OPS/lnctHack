const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const isTeamLeader = require("../middleware/isTeamLeader");
const {
  sendJoinRequest,
  getMyRequests,
  getIncomingRequests,
  withdrawRequest,
  getRequestById,
  acceptRequest,
  rejectRequest,
} = require("../controllers/joinRequest.controller");

// Send a join request
router.post("/send", authMiddleware, sendJoinRequest);

// Get logged-in user's own requests
router.get("/my-requests", authMiddleware, getMyRequests);

// Get incoming requests (for leader)
router.get("/incoming", authMiddleware, getIncomingRequests);

// Withdraw a pending request (sender only)
router.patch("/withdraw/:id", authMiddleware, withdrawRequest);

// Accept a request (leader only)
router.patch("/accept/:id", authMiddleware, isTeamLeader, acceptRequest);

// Reject a request (leader only)
router.patch("/reject/:id", authMiddleware, isTeamLeader, rejectRequest);

// Get a single request by ID
router.get("/:id", authMiddleware, getRequestById);

module.exports = router;
