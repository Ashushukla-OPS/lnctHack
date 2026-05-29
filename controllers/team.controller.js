const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const {
  createTeamService,
  getAllTeamsService,
  getSingleTeamService,
  deleteTeamService,
} = require("../services/team.service");
const Team = require("../models/team.model");

// CREATE TEAM
let createTeamController = asyncHandler(
  async (req, res) => {
    let team = await createTeamService(
      req.user._id,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Team created successfully",
      team,
    });
  }
);

// GET ALL TEAMS
let getAllTeamsController = asyncHandler(
  async (req, res) => {
    let teams = await getAllTeamsService();

    return res.status(200).json({
      success: true,
      totalTeams: teams.length,
      teams,
    });
  }
);

// GET SINGLE TEAM
let getSingleTeamController = asyncHandler(
  async (req, res) => {
    let { id } = req.params;
    let team = await getSingleTeamService(id);

    return res.status(200).json({
      success: true,
      team,
    });
  }
);

// DELETE TEAM
let deleteTeamController = asyncHandler(
  async (req, res) => {
    let { id } = req.params;
    await deleteTeamService(
      id,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      message: "Team deleted successfully",
    });
  }
);

// ADD SLOT
const addSlotController = asyncHandler(async (req, res) => {
  const team = req.team; // Attached by isTeamLeader middleware
  const { role, minScore, requiredSkills } = req.body;

  if (!role || !role.trim()) {
    throw new ApiError(400, "Slot role is required");
  }

  // Check if slot role already exists and is unfilled
  const existingSlot = team.openSlots.find(
    (s) => s.role.toLowerCase() === role.trim().toLowerCase() && !s.filled
  );
  if (existingSlot) {
    throw new ApiError(400, `An open slot for role ${role} already exists`);
  }

  team.openSlots.push({
    role: role.trim(),
    minScore: minScore !== undefined ? Number(minScore) : 0,
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
    filled: false,
    filledBy: null,
    pendingRequestsCount: 0,
  });

  await team.save();

  return res
    .status(200)
    .json(new ApiResponse("Slot added successfully", team));
});

// REMOVE SLOT
const removeSlotController = asyncHandler(async (req, res) => {
  const team = req.team; // Attached by isTeamLeader middleware
  const { slotId } = req.params;

  const slotIndex = team.openSlots.findIndex(
    (s) => s._id.toString() === slotId.toString()
  );

  if (slotIndex === -1) {
    throw new ApiError(404, "Slot not found");
  }

  team.openSlots.splice(slotIndex, 1);
  await team.save();

  return res
    .status(200)
    .json(new ApiResponse("Slot removed successfully", team));
});

// EDIT SLOT
const editSlotController = asyncHandler(async (req, res) => {
  const team = req.team; // Attached by isTeamLeader middleware
  const { slotId } = req.params;
  const { role, minScore, requiredSkills, filled } = req.body;

  const slot = team.openSlots.find(
    (s) => s._id.toString() === slotId.toString()
  );

  if (!slot) {
    throw new ApiError(404, "Slot not found");
  }

  if (role !== undefined) {
    if (!role.trim()) throw new ApiError(400, "Role cannot be empty");
    slot.role = role.trim();
  }

  if (minScore !== undefined) {
    slot.minScore = Number(minScore);
  }

  if (requiredSkills !== undefined) {
    slot.requiredSkills = Array.isArray(requiredSkills) ? requiredSkills : [];
  }

  if (filled !== undefined) {
    slot.filled = !!filled;
    if (!slot.filled) {
      slot.filledBy = null;
    }
  }

  await team.save();

  return res
    .status(200)
    .json(new ApiResponse("Slot updated successfully", team));
});

// LEAVE TEAM
const leaveTeamController = asyncHandler(async (req, res) => {
  const teamId = req.params.id;
  const userId = req.user._id;

  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // Check if user is a member
  const memberIndex = team.members.findIndex(
    (m) => m.userId.toString() === userId.toString()
  );

  if (memberIndex === -1) {
    throw new ApiError(400, "You are not a member of this team");
  }

  // If user is leader, prevent leaving
  if (team.leader.toString() === userId.toString()) {
    throw new ApiError(400, "Team leader cannot leave the team. Transfer leadership or delete the team instead.");
  }

  // Determine reputation penalty
  let action = "dropout_early";
  if (team.hackathonId) {
    const Hackathon = require("../models/hackathon.model");
    const hackathon = await Hackathon.findById(team.hackathonId);
    if (hackathon && hackathon.startDate <= new Date()) {
      action = "dropout_late";
    }
  }

  // Apply reputation penalty
  const reputationService = require("../services/reputationService");
  await reputationService.updateReputation(userId, action);

  // Reopen the slot that was filled by this user
  const slot = team.openSlots.find(
    (s) => s.filledBy && s.filledBy.toString() === userId.toString()
  );
  if (slot) {
    slot.filled = false;
    slot.filledBy = null;
  }

  // Remove member
  team.members.splice(memberIndex, 1);
  await team.save();

  // Create a system message in team chat
  const messageModel = require("../models/message.model");
  await messageModel.create({
    sender: userId,
    team: teamId,
    message: `${req.user.name} has left the team.`,
    messageType: "system",
  });

  // Notify team leader
  const { createNotification } = require("../services/notificationService");
  await createNotification({
    recipient: team.leader,
    sender: userId,
    type: "member_left",
    message: `${req.user.name} has left your team "${team.teamName}".`,
    relatedTeam: teamId,
  });

  // Emit socket event if available
  const io = req.app.get("io");
  if (io) {
    io.to(teamId).emit("member_left", { userId, teamId });
  }

  return res
    .status(200)
    .json(new ApiResponse("You have successfully left the team", {}));
});

module.exports = {
  createTeamController,
  getAllTeamsController,
  getSingleTeamController,
  deleteTeamController,
  addSlotController,
  removeSlotController,
  editSlotController,
  leaveTeamController,
};