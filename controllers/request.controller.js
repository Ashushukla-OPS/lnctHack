const asyncHandler = require("../utils/asyncHandler");

const {
  sendJoinRequestService,
  getMyRequestsService,
  getTeamRequestsService,
  acceptRequestService,
  rejectRequestService,
} = require("../services/request.service");




// SEND JOIN REQUEST
let sendJoinRequestController = asyncHandler(async (req, res) => {
  let request = await sendJoinRequestService(req.user._id, req.params.teamId);

  return res.status(201).json({
    success: true,
    message: "Join request sent successfully",
    request,
  });
});

// GET MY REQUESTS
let getMyRequestsController = asyncHandler(async (req, res) => {
  let requests = await getMyRequestsService(req.user._id);

  return res.status(200).json({
    success: true,
    totalRequests: requests.length,
    requests,
  });
});

// GET TEAM REQUESTS
let getTeamRequestsController = asyncHandler(async (req, res) => {
  let requests = await getTeamRequestsService(req.params.teamId, req.user._id);

  return res.status(200).json({
    success: true,
    totalRequests: requests.length,
    requests,
  });
});

// ACCEPT REQUEST
let acceptRequestController = asyncHandler(async (req, res) => {
  let request = await acceptRequestService(req.params.requestId, req.user._id);

  return res.status(200).json({
    success: true,
    message: "Request accepted successfully",
    request,
  });
});

// REJECT REQUEST
let rejectRequestController = asyncHandler(async (req, res) => {
  let request = await rejectRequestService(req.params.requestId, req.user._id);

  return res.status(200).json({
    success: true,
    message: "Request rejected successfully",
    request,
  });
});

module.exports = {
  sendJoinRequestController,
  getMyRequestsController,
  getTeamRequestsController,
  acceptRequestController,
  rejectRequestController,
};
