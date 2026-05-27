const requestModel = require("../models/request.model");

const teamModel = require("../models/team.model");

const ApiError = require("../utils/apiError");

// SEND JOIN REQUEST
let sendJoinRequestService = async (userId, teamId) => {
  // check team exists
  let team = await teamModel.findById(teamId);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // prevent leader requesting own team
  if (team.leader.toString() === userId.toString()) {
    throw new ApiError(400, "Leader cannot join own team");
  }

  // check already member
  let isMember = team.members.some(
    (member) => member.userId.toString() === userId.toString(),
  );

  if (isMember) {
    throw new ApiError(400, "Already a team member");
  }

  // check team full
  if (team.members.length >= team.maxMembers) {
    throw new ApiError(400, "Team is full");
  }

  // check existing pending request
  let existingRequest = await requestModel.findOne({
    user: userId,
    team: teamId,
    status: "pending",
  });

  if (existingRequest) {
    throw new ApiError(400, "Request already sent");
  }

  // create request
  let request = await requestModel.create({
    user: userId,
    team: teamId,
  });

  return request;
};

// GET MY REQUESTS
// requests RECEIVED by leader
let getMyRequestsService = async (userId) => {
  // find teams where user is leader
  let teams = await teamModel.find({
    leader: userId,
  });

  let teamIds = teams.map((team) => team._id);

  // find pending requests
  let requests = await requestModel

    .find({
      team: { $in: teamIds },
      status: "pending",
    })

    .populate("user", "name email tier skills")

    .populate("team", "teamName");

  return requests;
};

// GET TEAM REQUESTS
let getTeamRequestsService = async (teamId, userId) => {
  let team = await teamModel.findById(teamId);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // only leader can view
  if (team.leader.toString() !== userId.toString()) {
    throw new ApiError(403, "Only leader can view requests");
  }

  let requests = await requestModel

    .find({
      team: teamId,
      status: "pending",
    })

    .populate("user", "name email tier skills")

    .populate("team", "teamName");

  return requests;
};

// ACCEPT REQUEST
let acceptRequestService = async (requestId, userId) => {
  // find request
  let request = await requestModel.findById(requestId);

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  // already handled
  if (request.status !== "pending") {
    throw new ApiError(400, "Request already handled");
  }

  // find team
  let team = await teamModel.findById(request.team);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // only leader
  if (team.leader.toString() !== userId.toString()) {
    throw new ApiError(403, "Only leader can accept requests");
  }

  // check team full
  if (team.members.length >= team.maxMembers) {
    throw new ApiError(400, "Team is full");
  }

  // add member correctly
  team.members.push({
    userId: request.user,
    role: "Member",
    commitmentSigned: false,
  });

  await team.save();

  // update request
  request.status = "accepted";

  await request.save();

  return request;
};

// REJECT REQUEST
let rejectRequestService = async (requestId, userId) => {
  // find request
  let request = await requestModel.findById(requestId);

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  // already handled
  if (request.status !== "pending") {
    throw new ApiError(400, "Request already handled");
  }

  // find team
  let team = await teamModel.findById(request.team);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // only leader
  if (team.leader.toString() !== userId.toString()) {
    throw new ApiError(403, "Only leader can reject requests");
  }

  // reject request
  request.status = "rejected";

  await request.save();

  return request;
};

module.exports = {
  sendJoinRequestService,
  getMyRequestsService,
  getTeamRequestsService,
  acceptRequestService,
  rejectRequestService,
};
