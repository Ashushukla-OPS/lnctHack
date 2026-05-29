const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const RequestChat = require("../models/RequestChat");
const JoinRequest = require("../models/JoinRequest");
const { createNotification } = require("../services/notificationService");

// POST /api/request-chat/send/:requestId
const sendMessage = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!content || !content.trim()) {
    throw new ApiError(400, "Message content is required");
  }

  const request = await JoinRequest.findById(requestId);
  if (!request) {
    throw new ApiError(404, "Join request not found");
  }

  // Only sender or leader can chat
  const isSender = request.sender.toString() === userId.toString();
  const isLeader = request.leader.toString() === userId.toString();
  if (!isSender && !isLeader) {
    throw new ApiError(403, "Not authorized to send message in this chat");
  }

  // Only allow chat if request is still pending
  if (request.status !== "pending") {
    throw new ApiError(400, "Chat is only allowed for pending requests");
  }

  // Limit to 50 messages per request
  const messageCount = await RequestChat.countDocuments({ requestId });
  if (messageCount >= 50) {
    throw new ApiError(400, "Message limit of 50 reached for this request");
  }

  const message = await RequestChat.create({
    requestId,
    sender: userId,
    content: content.trim(),
  });

  // Notify the other participant
  const recipientId = isSender ? request.leader : request.sender;
  await createNotification({
    recipient: recipientId,
    sender: userId,
    type: "new_message",
    message: `${req.user.name} sent you a message about your join request`,
    relatedRequest: requestId,
    relatedTeam: request.team,
  });

  const populated = await message.populate("sender", "name email");

  return res
    .status(201)
    .json(new ApiResponse("Message sent successfully", populated));
});

// GET /api/request-chat/:requestId
const getMessages = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  const request = await JoinRequest.findById(requestId);
  if (!request) {
    throw new ApiError(404, "Join request not found");
  }

  const isSender = request.sender.toString() === userId.toString();
  const isLeader = request.leader.toString() === userId.toString();
  if (!isSender && !isLeader) {
    throw new ApiError(403, "Not authorized to view this chat");
  }

  const messages = await RequestChat.find({ requestId })
    .populate("sender", "name email")
    .sort({ createdAt: 1 });

  // Mark all messages sent by the other person as read
  await RequestChat.updateMany(
    { requestId, sender: { $ne: userId }, isRead: false },
    { isRead: true }
  );

  return res
    .status(200)
    .json(new ApiResponse("Messages fetched successfully", messages));
});

// PATCH /api/request-chat/read/:requestId
const markMessagesRead = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  const request = await JoinRequest.findById(requestId);
  if (!request) {
    throw new ApiError(404, "Join request not found");
  }

  const isSender = request.sender.toString() === userId.toString();
  const isLeader = request.leader.toString() === userId.toString();
  if (!isSender && !isLeader) {
    throw new ApiError(403, "Not authorized to update this chat");
  }

  // Mark all messages NOT sent by current user as read
  await RequestChat.updateMany(
    { requestId, sender: { $ne: userId }, isRead: false },
    { isRead: true }
  );

  return res
    .status(200)
    .json(new ApiResponse("Messages marked as read", {}));
});

module.exports = {
  sendMessage,
  getMessages,
  markMessagesRead,
};
