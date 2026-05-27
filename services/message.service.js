const messageModel = require("../models/message.model");

const teamModel = require("../models/team.model");

const ApiError = require("../utils/apiError");

// SEND MESSAGE
let sendMessageService = async (userId, teamId, data) => {
  let { message } = data;

  // validation
  if (!message) {
    throw new ApiError(400, "Message is required");
  }

  // check team exists
  let team = await teamModel.findById(teamId);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // check membership
  let isMember = team.members.some(
    (member) => member?.userId?.toString() === userId.toString(),
  );

  if (!isMember) {
    throw new ApiError(403, "Only team members can send messages");
  }

  // create message
  let newMessage = await messageModel.create({
    sender: userId,
    team: teamId,
    message,
  });


  return newMessage;
};

// GET TEAM MESSAGES
let getTeamMessagesService = async (teamId, userId) => {
  // check team exists
  let team = await teamModel.findById(teamId);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  // check membership
  let isMember = team.members.some(
    (member) => member?.userId?.toString() === userId.toString(),
  );

  if (!isMember) {
    throw new ApiError(403, "Only team members can view messages");
  }

  // fetch messages
  let messages = await messageModel

    .find({ team: teamId })

    .sort({ createdAt: 1 })

    .populate("sender", "name email tier");

  return messages;
};

// DELETE MESSAGE
let deleteMessageService = async (messageId, userId) => {
  // find message
  let message = await messageModel.findById(messageId);

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // only sender can delete
  if (message.sender.toString() !== userId.toString()) {
    throw new ApiError(403, "Only sender can delete message");
  }

  await messageModel.findByIdAndDelete(messageId);

  return true;
};

module.exports = {
  sendMessageService,
  getTeamMessagesService,
  deleteMessageService,
};
