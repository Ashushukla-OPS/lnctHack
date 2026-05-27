const asyncHandler = require("../utils/asyncHandler");

const {
  sendMessageService,
  getTeamMessagesService,
  deleteMessageService,
} = require("../services/message.service");

// SEND MESSAGE
let sendMessageController = asyncHandler(async (req, res) => {

  let message = await sendMessageService(
    req.user._id,
    req.params.teamId,
    req.body,
  );
  

  return res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: message,
  });

});

// GET TEAM MESSAGES
let getTeamMessagesController = asyncHandler(async (req, res) => {
  let messages = await getTeamMessagesService(req.params.teamId, req.user._id);

  return res.status(200).json({
    success: true,
    totalMessages: messages.length,
    messages,
  });
});

// DELETE MESSAGE
let deleteMessageController = asyncHandler(async (req, res) => {
  await deleteMessageService(req.params.messageId, req.user._id);

  return res.status(200).json({
    success: true,
    message: "Message deleted successfully",
  });
});

module.exports = {
  sendMessageController,
  getTeamMessagesController,
  deleteMessageController,
};
