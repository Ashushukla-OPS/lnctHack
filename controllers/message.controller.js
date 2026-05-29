const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const {
  sendMessageService,
  getTeamMessagesService,
  deleteMessageService,
  editMessageService,
  reactMessageService,
  getUnreadMessageCountService,
} = require("../services/message.service");

const ChatSummary = require("../models/ChatSummary");
const MessageModel = require("../models/message.model");

// SEND MESSAGE
let sendMessageController = asyncHandler(async (req, res) => {
  let message = await sendMessageService(
    req.user._id,
    req.params.teamId,
    req.body
  );

  // Notify via Socket.io if available
  const io = req.app.get("io");
  if (io) {
    io.to(req.params.teamId).emit("new_team_message", message);
  }

  // Non-blocking auto stale marking check
  const teamId = req.params.teamId;
  MessageModel.countDocuments({ team: teamId }).then(async (count) => {
    const summaries = await ChatSummary.find({ teamId });
    for (const summary of summaries) {
      if ((count - (summary.messageCountAt || 0)) >= 20) {
        await ChatSummary.updateOne(
          { _id: summary._id },
          { isStale: true }
        );
      }
    }
  }).catch(() => {});

  return res.status(201).json(new ApiResponse("Message sent successfully", message));
});

// GET TEAM MESSAGES
let getTeamMessagesController = asyncHandler(async (req, res) => {
  let messages = await getTeamMessagesService(req.params.teamId, req.user._id);

  return res.status(200).json(new ApiResponse("Messages fetched successfully", messages));
});

// DELETE MESSAGE
let deleteMessageController = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { mode } = req.query; // 'self' (soft delete) or 'everyone' (hard delete)

  // Grab teamId BEFORE deleting (service may hard-delete the doc)
  const MessageModel2 = require("../models/message.model");
  const msgDoc = await MessageModel2.findById(messageId);
  const teamIdForSocket = msgDoc ? msgDoc.team?.toString() : null;

  await deleteMessageService(messageId, req.user._id, mode || "everyone");

  // Notify via Socket.io
  const io = req.app.get("io");
  if (io && mode !== "self" && teamIdForSocket) {
    io.to(teamIdForSocket).emit("message_deleted", { messageId });
  }

  return res.status(200).json(new ApiResponse("Message deleted successfully", {}));
});

// EDIT MESSAGE
let editMessageController = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { message: newContent } = req.body;

  const updatedMessage = await editMessageService(messageId, req.user._id, newContent);

  const io = req.app.get("io");
  if (io) {
    io.to(updatedMessage.team.toString()).emit("message_edited", updatedMessage);
  }

  return res.status(200).json(new ApiResponse("Message edited successfully", updatedMessage));
});

// REACT TO MESSAGE
let reactMessageController = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  const updatedMessage = await reactMessageService(messageId, req.user._id, emoji);

  const io = req.app.get("io");
  if (io) {
    io.to(updatedMessage.team.toString()).emit("message_reaction_updated", updatedMessage);
  }

  return res.status(200).json(new ApiResponse("Reaction updated successfully", updatedMessage));
});

// GET UNREAD MESSAGES COUNT
let getUnreadMessageCountController = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const result = await getUnreadMessageCountService(teamId, req.user._id);

  return res.status(200).json(new ApiResponse("Unread messages count fetched successfully", result));
});

module.exports = {
  sendMessageController,
  getTeamMessagesController,
  deleteMessageController,
  editMessageController,
  reactMessageController,
  getUnreadMessageCountController,
};
