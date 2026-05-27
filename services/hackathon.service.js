const HackathonModel = require("../models/hackathon.model");

const ApiError = require("../utils/apiError");

// CREATE HACKATHON
let createHackathonService = async (data) => {
  let {
    name,
    organizer,
    description,
    startDate,
    endDate,
    submissionDeadline,
    mode,
    location,
    maxTeamSize,
  } = data;

  // validations
  if (
    !name ||
    !organizer ||
    !startDate ||
    !endDate ||
    !submissionDeadline ||
    !mode
  ) {
    throw new ApiError(400, "All required fields are mandatory");
  }

  let hackathon = await HackathonModel.create({
    name,

    organizer,

    description,

    startDate,

    endDate,

    submissionDeadline,

    mode,

    location: location || "",

    maxTeamSize: maxTeamSize || 5,
  });

  return hackathon;
};

// GET ALL HACKATHONS
let getAllHackathonsService = async () => {
  let hackathons = await HackathonModel.find()

    .populate("registeredStudents", "name email tier")

    .populate("teams", "teamName")

    .sort({ createdAt: -1 });

  return hackathons;
};

// GET SINGLE HACKATHON
let getSingleHackathonService = async (hackathonId) => {
  let hackathon = await HackathonModel.findById(hackathonId)

    .populate("registeredStudents", "name email tier")

    .populate("teams", "teamName description");

  if (!hackathon) {
    throw new ApiError(404, "Hackathon not found");
  }

  return hackathon;
};

// REGISTER HACKATHON
let registerHackathonService = async (userId, hackathonId) => {
  let hackathon = await HackathonModel.findById(hackathonId);

  if (!hackathon) {
    throw new ApiError(404, "Hackathon not found");
  }

  // already registered
  let alreadyRegistered = hackathon.registeredStudents.some(
    (student) => student.toString() === userId.toString(),
  );

  if (alreadyRegistered) {
    throw new ApiError(400, "Already registered");
  }

  hackathon.registeredStudents.push(userId);

  await hackathon.save();

  return hackathon;
};

// DELETE HACKATHON
let deleteHackathonService = async (hackathonId) => {
  let hackathon = await HackathonModel.findById(hackathonId);

  if (!hackathon) {
    throw new ApiError(404, "Hackathon not found");
  }

  await HackathonModel.findByIdAndDelete(hackathonId);

  return true;
};

module.exports = {
  createHackathonService,
  getAllHackathonsService,
  getSingleHackathonService,
  registerHackathonService,
  deleteHackathonService,
};
