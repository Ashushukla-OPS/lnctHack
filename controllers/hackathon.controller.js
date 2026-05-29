const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const {
  createHackathonService,
  getAllHackathonsService,
  getSingleHackathonService,
  registerHackathonService,
  deleteHackathonService,
  getHackathonTimerService,
} = require("../services/hackathon.service");

// CREATE HACKATHON
let createHackathonController = asyncHandler(async (req, res) => {
  let hackathon = await createHackathonService(req.body);

  return res.status(201).json({
    success: true,
    message: "Hackathon created successfully",
    hackathon,
  });
});

// GET ALL HACKATHONS
let getAllHackathonsController = asyncHandler(async (req, res) => {
  let hackathons = await getAllHackathonsService();

  return res.status(200).json({
    success: true,
    totalHackathons: hackathons.length,
    hackathons,
  });
});

// GET SINGLE HACKATHON
let getSingleHackathonController = asyncHandler(async (req, res) => {
  let hackathon = await getSingleHackathonService(req.params.hackathonId);

  return res.status(200).json({
    success: true,
    hackathon,
  });
});

// REGISTER HACKATHON
let registerHackathonController = asyncHandler(async (req, res) => {
  let hackathon = await registerHackathonService(
    req.user._id,
    req.params.hackathonId,
  );

  return res.status(200).json({
    success: true,
    message: "Registered successfully",
    hackathon,
  });
});

// DELETE HACKATHON
let deleteHackathonController = asyncHandler(async (req, res) => {
  await deleteHackathonService(req.params.hackathonId);

  return res.status(200).json({
    success: true,
    message: "Hackathon deleted successfully",
  });
});

// GET HACKATHON TIMER
const getHackathonTimerController = asyncHandler(async (req, res) => {
  const result = await getHackathonTimerService(req.params.hackathonId);

  return res.status(200).json(new ApiResponse("Hackathon countdown timer fetched successfully", result));
});

module.exports = {
  createHackathonController,
  getAllHackathonsController,
  getSingleHackathonController,
  registerHackathonController,
  deleteHackathonController,
  getHackathonTimerController,
};
