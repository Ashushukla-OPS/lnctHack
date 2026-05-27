const asynchandler = require("../utils/asyncHandler");

const {
  getCurrentUserService,
  updateProfileService,
  getAllUsersService,
  getSingleUserService,
} = require("../services/user.service");
const asyncHandler = require("../utils/asyncHandler");
const { exploreUsersService } = require("../services/user.service");

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

module.exports = {
  getCurrentUserController,
  updateProfileController,
  getAllUsersController,
  getSingleUserController,
  exploreUsersController
};
