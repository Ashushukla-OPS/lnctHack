const JoinRequest = require("../models/JoinRequest");
const ApiError = require("../utils/apiError");

const isRequestParticipant = async (req, res, next) => {
  try {
    const requestId = req.params.requestId || req.params.id;

    if (!requestId) {
      throw new ApiError(400, "Request ID is required");
    }

    const request = await JoinRequest.findById(requestId);
    if (!request) {
      throw new ApiError(404, "Join request not found");
    }

    const userIdStr = req.user._id.toString();
    const isSender = request.sender.toString() === userIdStr;
    const isLeader = request.leader.toString() === userIdStr;

    if (!isSender && !isLeader) {
      throw new ApiError(403, "Not authorized to access this chat");
    }

    req.joinRequest = request;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = isRequestParticipant;
