const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const Meet = require("../models/Meet");
const Team = require("../models/team.model");
const { createNotification } = require("../services/notificationService");

// POST /api/meet/schedule/:teamId
const scheduleMeet = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { title, scheduledAt, duration } = req.body;
  const userId = req.user._id;

  if (!title || !title.trim()) {
    throw new ApiError(400, "Meet title is required");
  }
  if (!scheduledAt) {
    throw new ApiError(400, "Scheduled date and time are required");
  }

  // Check if team exists (usually isTeamMember middleware does this, but let's be fully robust)
  const team = req.team || await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // Only leader can schedule a meet
  if (team.leader.toString() !== userId.toString()) {
    throw new ApiError(403, "Only the team leader can schedule meetings");
  }

  const roomId = uuidv4();
  const meet = await Meet.create({
    teamId,
    title: title.trim(),
    scheduledAt: new Date(scheduledAt),
    duration: duration !== undefined ? Number(duration) : 60,
    createdBy: userId,
    roomId,
    status: "scheduled",
    participants: [],
  });

  // Notify other team members
  for (const member of team.members) {
    if (member.userId.toString() !== userId.toString()) {
      await createNotification({
        recipient: member.userId,
        sender: userId,
        type: "team_update",
        message: `${req.user.name} scheduled a meet: ${title.trim()} on ${new Date(scheduledAt).toLocaleString()}`,
        relatedTeam: teamId,
      });
    }
  }

  const populated = await meet.populate("createdBy", "name email");

  return res.status(201).json(new ApiResponse("Meet scheduled successfully", populated));
});

// GET /api/meet/:teamId
const getTeamMeets = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  const meets = await Meet.find({ teamId })
    .populate("createdBy", "name email")
    .sort({ scheduledAt: -1 });

  return res.status(200).json(new ApiResponse("Meets fetched successfully", meets));
});

// GET /api/meet/room/:roomId
const getMeetRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const meet = await Meet.findOne({ roomId })
    .populate("createdBy", "name email")
    .populate("participants.userId", "name email tier");

  if (!meet) {
    throw new ApiError(404, "Meeting not found");
  }

  if (meet.status === "ended") {
    throw new ApiError(403, "Meet has ended");
  }

  // Verify membership
  const team = await Team.findById(meet.teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  const isMember = team.members.some(
    (member) => member.userId.toString() === userId.toString()
  );

  if (!isMember) {
    throw new ApiError(403, "Only team members are authorized to join this meeting room");
  }

  return res.status(200).json(new ApiResponse("Meeting room fetched successfully", meet));
});

// PATCH /api/meet/start/:roomId
const startMeet = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const meet = await Meet.findOne({ roomId });
  if (!meet) {
    throw new ApiError(404, "Meeting not found");
  }

  // Get team context
  const team = await Team.findById(meet.teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // Only leader can start meet
  if (team.leader.toString() !== userId.toString()) {
    throw new ApiError(403, "Only the team leader can start the meeting");
  }

  if (meet.status === "ended") {
    throw new ApiError(400, "Cannot start a meeting that has already ended");
  }

  meet.status = "live";
  await meet.save();

  // Socket.io emission
  const io = req.app.get("io");
  if (io) {
    io.to(meet.teamId.toString()).emit("meet-started", meet);
  }

  // Notify team members
  for (const member of team.members) {
    await createNotification({
      recipient: member.userId,
      sender: userId,
      type: "team_update",
      message: `"${meet.title}" is live now — join the meet!`,
      relatedTeam: meet.teamId,
    });
  }

  const populated = await meet.populate("createdBy", "name email");

  return res.status(200).json(new ApiResponse("Meet started successfully", populated));
});

// PATCH /api/meet/end/:roomId
const endMeet = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const meet = await Meet.findOne({ roomId });
  if (!meet) {
    throw new ApiError(404, "Meeting not found");
  }

  const team = await Team.findById(meet.teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // Only leader can end meet
  if (team.leader.toString() !== userId.toString()) {
    throw new ApiError(403, "Only the team leader can end the meeting");
  }

  meet.status = "ended";
  await meet.save();

  // Socket.io emission
  const io = req.app.get("io");
  if (io) {
    io.to(roomId).emit("meet-ended", { roomId });
  }

  return res.status(200).json(new ApiResponse("Meet ended successfully", {}));
});

// DELETE /api/meet/:meetId
const deleteMeet = asyncHandler(async (req, res) => {
  const { meetId } = req.params;
  const userId = req.user._id;

  const meet = await Meet.findById(meetId);
  if (!meet) {
    throw new ApiError(404, "Meeting not found");
  }

  const team = await Team.findById(meet.teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // Only leader can cancel
  if (team.leader.toString() !== userId.toString()) {
    throw new ApiError(403, "Only the team leader can cancel meetings");
  }

  if (meet.status !== "scheduled") {
    throw new ApiError(400, "Only scheduled meetings can be cancelled");
  }

  // Notify team members
  for (const member of team.members) {
    if (member.userId.toString() !== userId.toString()) {
      await createNotification({
        recipient: member.userId,
        sender: userId,
        type: "team_update",
        message: `Meet cancelled: ${meet.title}`,
        relatedTeam: meet.teamId,
      });
    }
  }

  await Meet.findByIdAndDelete(meetId);

  return res.status(200).json(new ApiResponse("Meet cancelled successfully", {}));
});

module.exports = {
  scheduleMeet,
  getTeamMeets,
  getMeetRoom,
  startMeet,
  endMeet,
  deleteMeet,
};
