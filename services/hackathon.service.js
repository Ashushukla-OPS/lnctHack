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

// GET HACKATHON TIMER
const getHackathonTimerService = async (hackathonId) => {
  const hackathon = await HackathonModel.findById(hackathonId);
  if (!hackathon) {
    throw new ApiError(404, "Hackathon not found");
  }

  const now = new Date();
  let targetDate = null;
  let phase = "";

  if (now < hackathon.startDate) {
    targetDate = hackathon.startDate;
    phase = "upcoming";
  } else if (now <= hackathon.submissionDeadline) {
    targetDate = hackathon.submissionDeadline;
    phase = "ongoing";
  } else if (now <= hackathon.endDate) {
    targetDate = hackathon.endDate;
    phase = "grading";
  } else {
    phase = "completed";
  }

  let timeRemainingMs = 0;
  let countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };

  if (targetDate) {
    timeRemainingMs = targetDate.getTime() - now.getTime();
    
    const seconds = Math.floor((timeRemainingMs / 1000) % 60);
    const minutes = Math.floor((timeRemainingMs / 1000 / 60) % 60);
    const hours = Math.floor((timeRemainingMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(timeRemainingMs / (1000 * 60 * 60 * 24));

    countdown = { days, hours, minutes, seconds };
  }

  return {
    hackathonName: hackathon.name,
    phase,
    now,
    targetDate,
    timeRemainingMs,
    countdown,
  };
};

module.exports = {
  createHackathonService,
  getAllHackathonsService,
  getSingleHackathonService,
  registerHackathonService,
  deleteHackathonService,
  getHackathonTimerService,
};
