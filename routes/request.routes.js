const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");

const {
  sendJoinRequestController,
  getMyRequestsController,
  getTeamRequestsController,
  acceptRequestController,
  rejectRequestController,
} = require("../controllers/request.controller");

const router = express.Router();



// SEND JOIN REQUEST
router.post(
  "/send/:teamId",
  authMiddleware,
  sendJoinRequestController
);



// GET MY REQUESTS
router.get(
  "/my-requests",
  authMiddleware,
  getMyRequestsController
);



// GET TEAM REQUESTS (IMPORTANT)
router.get(
  "/team/:teamId",
  authMiddleware,
  getTeamRequestsController
);



// ACCEPT REQUEST
router.patch(
  "/accept/:requestId",
  authMiddleware,
  acceptRequestController
);



// REJECT REQUEST
router.patch(
  "/reject/:requestId",
  authMiddleware,
  rejectRequestController
);



module.exports = router;
