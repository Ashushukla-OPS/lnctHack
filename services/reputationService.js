const User = require("../models/user.model");
const ApiError = require("../utils/apiError");

const updateReputation = async (userId, action) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let scoreDiff = 0;
  let isDropout = false;

  switch (action) {
    case "completed":
      scoreDiff = 10;
      break;
    case "accepted_stay":
      scoreDiff = 5;
      break;
    case "dropout_early":
      scoreDiff = -10;
      isDropout = true;
      break;
    case "dropout_late":
      scoreDiff = -25;
      isDropout = true;
      break;
    case "rejected_3x":
      scoreDiff = -5;
      break;
    default:
      throw new ApiError(400, "Invalid reputation action");
  }

  // Update reputation score and clamp between 0 and 200
  user.reputationScore = Math.max(0, Math.min(200, (user.reputationScore || 100) + scoreDiff));

  if (isDropout) {
    user.totalDropouts = (user.totalDropouts || 0) + 1;
  }

  // Auto-blacklist if dropouts are 3 or more
  if (user.totalDropouts >= 3) {
    user.isBlacklisted = true;
    user.blacklistedReason = "Exceeded maximum allowed dropouts (3 or more)";
  }

  await user.save();
  return user;
};

module.exports = {
  updateReputation,
};
