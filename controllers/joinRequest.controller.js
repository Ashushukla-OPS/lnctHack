const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const JoinRequest = require("../models/JoinRequest");
const Team = require("../models/team.model");
const Message = require("../models/message.model");
const { createNotification } = require("../services/notificationService");
const { updateReputation } = require("../services/reputationService");
const {
  isSlotAvailable,
  fillSlot,
  incrementPending,
  decrementPending,
} = require("../services/slotService");

// POST /api/join-request/send
const sendJoinRequest = asyncHandler(async (req, res) => {
  const { teamId, appliedRole, message } = req.body;
  const userId = req.user._id;

  if (!teamId || !appliedRole) {
    throw new ApiError(400, "teamId and appliedRole are required");
  }

  // Check if user is blacklisted
  if (req.user.isBlacklisted) {
    throw new ApiError(403, "You are blacklisted and cannot send join requests");
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // Check if user is already a member
  const isMember = team.members.some(
    (m) => m.userId.toString() === userId.toString()
  );
  if (isMember) {
    throw new ApiError(400, "You are already a member of this team");
  }

  // Check for existing pending request to this team
  const existingRequest = await JoinRequest.findOne({
    sender: userId,
    team: teamId,
    status: "pending",
  });
  if (existingRequest) {
    throw new ApiError(400, "You already have a pending request for this team");
  }

  // Check if user has fewer than 3 total pending requests
  const pendingCount = await JoinRequest.countDocuments({
    sender: userId,
    status: "pending",
  });
  if (pendingCount >= 3) {
    throw new ApiError(400, "You cannot have more than 3 pending requests at a time");
  }

  // Check slot exists and is available
  const slot = team.openSlots.find((s) => s.role === appliedRole && !s.filled);
  if (!slot) {
    throw new ApiError(400, `No open slot found for role: ${appliedRole}`);
  }

  // Check slot pending count < 5
  if ((slot.pendingRequestsCount || 0) >= 5) {
    throw new ApiError(400, "This slot already has the maximum number of pending requests");
  }

  // Create join request
  const newRequest = await JoinRequest.create({
    team: teamId,
    sender: userId,
    leader: team.leader,
    appliedRole,
    message: message || "",
    status: "pending",
  });

  // Increment pending count on slot
  await incrementPending(teamId, appliedRole);

  // Send notification to leader
  await createNotification({
    recipient: team.leader,
    sender: userId,
    type: "join_interest",
    message: `${req.user.name} is interested in joining your team as ${appliedRole}`,
    relatedRequest: newRequest._id,
    relatedTeam: teamId,
  });

  return res
    .status(201)
    .json(new ApiResponse("Interest sent successfully", newRequest));
});

// GET /api/join-request/my-requests
const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await JoinRequest.find({ sender: req.user._id })
    .populate("team", "teamName description")
    .populate("leader", "name email")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse("My requests fetched successfully", requests));
});

// GET /api/join-request/incoming
const getIncomingRequests = asyncHandler(async (req, res) => {
  const filter = { leader: req.user._id };
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const requests = await JoinRequest.find(filter)
    .populate("sender", "name email tier scores")
    .populate("team", "teamName description")
    .sort({ createdAt: -1 });

  // Mark all returned requests as seen by leader
  const requestIds = requests.map((r) => r._id);
  await JoinRequest.updateMany(
    { _id: { $in: requestIds }, seenByLeader: false },
    { seenByLeader: true }
  );

  return res
    .status(200)
    .json(new ApiResponse("Incoming requests fetched successfully", requests));
});

// PATCH /api/join-request/withdraw/:id
const withdrawRequest = asyncHandler(async (req, res) => {
  const request = await JoinRequest.findById(req.params.id);
  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.sender.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the sender can withdraw this request");
  }

  if (request.status !== "pending") {
    throw new ApiError(400, "Only pending requests can be withdrawn");
  }

  request.status = "withdrawn";
  await request.save();

  // Decrement pending count
  await decrementPending(request.team, request.appliedRole);

  return res
    .status(200)
    .json(new ApiResponse("Request withdrawn successfully", {}));
});

// GET /api/join-request/:id
const getRequestById = asyncHandler(async (req, res) => {
  const request = await JoinRequest.findById(req.params.id)
    .populate("team", "teamName description leader")
    .populate("sender", "name email tier scores")
    .populate("leader", "name email");

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  const userIdStr = req.user._id.toString();
  const isSender = request.sender._id.toString() === userIdStr;
  const isLeader = request.leader._id.toString() === userIdStr;

  if (!isSender && !isLeader) {
    throw new ApiError(403, "Not authorized to view this request");
  }

  return res
    .status(200)
    .json(new ApiResponse("Request fetched successfully", request));
});

// PATCH /api/join-request/accept/:id
const acceptRequest = asyncHandler(async (req, res) => {
  const request = await JoinRequest.findById(req.params.id);
  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.status !== "pending") {
    throw new ApiError(400, "Only pending requests can be accepted");
  }

  const team = await Team.findById(request.team);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // Check leader
  if (team.leader.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only team leader can accept requests");
  }

  // Check slot is still available
  const slotAvailable = await isSlotAvailable(request.team, request.appliedRole);
  if (!slotAvailable) {
    throw new ApiError(400, "Slot is already filled");
  }

  // Check user not already in team
  const alreadyMember = team.members.some(
    (m) => m.userId.toString() === request.sender.toString()
  );
  if (alreadyMember) {
    throw new ApiError(400, "User is already a member of this team");
  }

  // Add sender to team members
  team.members.push({
    userId: request.sender,
    role: request.appliedRole,
    commitmentSigned: true,
    joinedAt: new Date(),
  });
  await team.save();

  // Fill the slot
  await fillSlot(request.team, request.appliedRole, request.sender);

  // Update request status
  request.status = "accepted";
  await request.save();

  // Auto-reject other pending requests from same sender for teams in same hackathon
  if (team.hackathonId) {
    const sameHackathonTeams = await Team.find({
      hackathonId: team.hackathonId,
      _id: { $ne: team._id },
    }).select("_id");

    const sameHackathonTeamIds = sameHackathonTeams.map((t) => t._id);

    await JoinRequest.updateMany(
      {
        sender: request.sender,
        team: { $in: sameHackathonTeamIds },
        status: "pending",
      },
      { status: "rejected" }
    );
  }

  // Update reputation
  await updateReputation(request.sender, "accepted_stay");

  // Send notification to sender
  await createNotification({
    recipient: request.sender,
    sender: req.user._id,
    type: "request_accepted",
    message: `Your request to join ${team.teamName} as ${request.appliedRole} has been accepted!`,
    relatedTeam: request.team,
    relatedRequest: request._id,
  });

  // Emit socket event (if io is available)
  const io = req.app.get("io");
  if (io) {
    io.to(request.team.toString()).emit("member-joined", {
      teamId: request.team,
      userId: request.sender,
      role: request.appliedRole,
    });
  }

  // Create system message in team chat
  const senderUser = await require("../models/user.model").findById(request.sender).select("name");
  await Message.create({
    sender: request.sender,
    team: request.team,
    message: `${senderUser?.name || "A new member"} has joined as ${request.appliedRole}`,
    messageType: "system",
  });

  return res
    .status(200)
    .json(new ApiResponse("Member accepted and added to team", {}));
});

// PATCH /api/join-request/reject/:id
const rejectRequest = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  const request = await JoinRequest.findById(req.params.id);
  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.status !== "pending") {
    throw new ApiError(400, "Only pending requests can be rejected");
  }

  const team = await Team.findById(request.team);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // Check leader
  if (team.leader.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only team leader can reject requests");
  }

  // Update request
  request.status = "rejected";
  request.rejectionReason = rejectionReason || "";
  await request.save();

  // Decrement pending count
  await decrementPending(request.team, request.appliedRole);

  // Send notification to sender
  await createNotification({
    recipient: request.sender,
    sender: req.user._id,
    type: "request_rejected",
    message: `Your request to join ${team.teamName} was not accepted.${
      rejectionReason ? ` Reason: ${rejectionReason}` : ""
    }`,
    relatedTeam: request.team,
    relatedRequest: request._id,
  });

  return res
    .status(200)
    .json(new ApiResponse("Request rejected successfully", {}));
});

module.exports = {
  sendJoinRequest,
  getMyRequests,
  getIncomingRequests,
  withdrawRequest,
  getRequestById,
  acceptRequest,
  rejectRequest,
};
