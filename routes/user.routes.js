const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");
const {
  getCurrentUserController,
  updateProfileController,
  getAllUsersController,
  getSingleUserController,
  exploreUsersController,
  getUserReputationController,
} = require("../controllers/user.controller");

const router = express.Router();

// Get logged-in user
router.get("/me", authMiddleware, getCurrentUserController);

// Update profile
router.patch("/update-profile", authMiddleware, updateProfileController);

// Get all users
router.get("/", authMiddleware, getAllUsersController);

router.get("/explore", authMiddleware, exploreUsersController);

// Get user reputation (Must be declared before GET /:id to avoid conflict)
router.get("/:id/reputation", authMiddleware, getUserReputationController);

// Get single user
router.get("/:id", authMiddleware, getSingleUserController);

module.exports = router;
