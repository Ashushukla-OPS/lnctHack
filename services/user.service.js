const userModel = require("../models/user.model");
const ApiError = require("../utils/apiError");

let getCurrentUserService = async (userId) => {
  let user = await userModel.findById(userId).select("-password -refreshToken");

  return user;
};

let updateProfileService = async (userId, data) => {
  let { bio, skills, role, availability, profilePic } = data;

  // Find and update user
  let updatedUser = await userModel
    .findByIdAndUpdate(
      userId,
      {
        bio,
        skills,
        role,
        availability,
        profilePic,
      },
      {
        new: true,
      },
    )
    .select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return updatedUser;
};

let getAllUsersService = async () => {
  let users = await userModel.find().select("-password -refreshToken");

  return users;
};

let getSingleUserService = async (userId) => {
  let user = await userModel.findById(userId).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

let exploreUsersService = async (query) => {
  let filter = {};

  // Filter by skill (case-insensitive)
  if (query.skill) {
    filter.skills = {
      $regex: query.skill,
      $options: "i",
    };
  }

  // Filter by role (case-insensitive)
  if (query.role) {
    filter.role = {
      $regex: query.role,
      $options: "i",
    };
  }

  // Filter by availability (case-insensitive)
  if (query.availability) {
    filter.availability = {
      $regex: query.availability,
      $options: "i",
    };
  }

  let users = await userModel.find(filter);

  return users;
};

module.exports = {
  getCurrentUserService,
  updateProfileService,
  getAllUsersService,
  getSingleUserService,
  exploreUsersService,
};
