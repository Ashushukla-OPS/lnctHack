const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const User = require("../models/user.model");
const {
  getCurrentUserService,
  updateProfileService,
  getAllUsersService,
  getSingleUserService,
  exploreUsersService,
} = require("../services/user.service");

let getCurrentUserController = asyncHandler(async (req, res) => {
  let user = await getCurrentUserService(req.user._id);

  return res.status(200).json({
    success: true,
    user,
  });
});

let updateProfileController = asyncHandler(async (req, res) => {
  let updatedUser = await updateProfileService(req.user._id, req.body);

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser,
  });
});

let getAllUsersController = asyncHandler(async (req, res) => {
  let users = await getAllUsersService();

  return res.status(200).json({
    success: true,
    totalUsers: users.length,
    users,
  });
});

let getSingleUserController = asyncHandler(async (req, res) => {
  let user = await getSingleUserService(req.params.id);

  return res.status(200).json({
    success: true,
    user: user,
  });
});

let exploreUsersController = asyncHandler(async (req, res) => {
  let users = await exploreUsersService(req.query);

  return res.status(200).json({
    success: true,
    totalUsers: users.length,
    users,
  });
});

// GET USER REPUTATION & BADGES
const getUserReputationController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const score = user.reputationScore !== undefined ? user.reputationScore : 100;
  const dropouts = user.totalDropouts || 0;
  const teamsJoined = user.totalTeamsJoined || 0;

  // Determine badges dynamically
  const badges = [];
  if (score >= 180) {
    badges.push({ name: "Elite Hacker", color: "#FFD700", description: "Maintained a flawless top-tier reputation score above 180" });
  }
  if (score >= 150) {
    badges.push({ name: "Collaborator Pro", color: "#C0C0C0", description: "Demonstrated excellent collaboration and consistent team participation" });
  }
  if (score >= 120) {
    badges.push({ name: "Active Team Player", color: "#CD7F32", description: "Consistently joined teams and supported teammates" });
  }
  if (score >= 80 && score < 120) {
    badges.push({ name: "Reliable Member", color: "#4CAF50", description: "Maintained a stable and reliable reputation score" });
  }
  if (score < 80) {
    badges.push({ name: "Needs Improvement", color: "#FF9800", description: "Reputation score has dropped due to team leaves or rejections" });
  }
  if (dropouts >= 2) {
    badges.push({ name: "Frequent Dropout", color: "#F44336", description: "Dropped out of multiple teams close to hackathon deadlines" });
  }

  // Determine standing level
  let standing = "Standard";
  if (user.isBlacklisted) standing = "Blacklisted";
  else if (score >= 160) standing = "Excellent standing";
  else if (score >= 120) standing = "Good standing";
  else if (score >= 80) standing = "Standard standing";
  else if (score < 80) standing = "At risk of blacklist";

  const reputationData = {
    userId: user._id,
    userName: user.name,
    reputationScore: score,
    tier: user.tier,
    standing,
    totalTeamsJoined: teamsJoined,
    totalDropouts: dropouts,
    isBlacklisted: user.isBlacklisted,
    blacklistedReason: user.blacklistedReason || "",
    badges,
  };

  return res.status(200).json(new ApiResponse("User reputation statistics fetched successfully", reputationData));
});

module.exports = {
  getCurrentUserController,
  updateProfileController,
  getAllUsersController,
  getSingleUserController,
  exploreUsersController,
  getUserReputationController,
};
