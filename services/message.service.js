const messageModel = require("../models/message.model");
const teamModel = require("../models/team.model");
const ApiError = require("../utils/apiError");

// SEND MESSAGE
let sendMessageService = async (userId, teamId, data) => {
  let { message, messageType, replyTo } = data;

  if (!message || !message.trim()) {
    throw new ApiError(400, "Message content is required");
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
    message: message.trim(),
    messageType: messageType || "text",
    replyTo: replyTo || null,
  });

  // Update sender's lastReadAt in the team
  await teamModel.updateOne(
    { _id: teamId, "members.userId": userId },
    { $set: { "members.$.lastReadAt": new Date() } }
  );

  const populated = await newMessage.populate("sender", "name email tier");
  return populated;
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

  // fetch messages (filter out those soft deleted for this user)
  let messages = await messageModel
    .find({
      team: teamId,
      deletedFor: { $ne: userId }
    })
    .sort({ createdAt: 1 })
    .populate("sender", "name email tier")
    .populate({
      path: "replyTo",
      populate: { path: "sender", select: "name" }
    });

  // update user's lastReadAt for the team
  await teamModel.updateOne(
    { _id: teamId, "members.userId": userId },
    { $set: { "members.$.lastReadAt": new Date() } }
  );

  return messages;
};

// DELETE MESSAGE
let deleteMessageService = async (messageId, userId, mode = "everyone") => {
  // find message
  let message = await messageModel.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // check team membership to ensure they can delete
  let team = await teamModel.findById(message.team);
  if (!team) {
    throw new ApiError(404, "Team associated with the message not found");
  }

  let isMember = team.members.some(
    (member) => member?.userId?.toString() === userId.toString(),
  );
  if (!isMember) {
    throw new ApiError(403, "Only team members can delete messages");
  }

  if (mode === "self") {
    // Soft delete: add user to deletedFor list
    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
      await message.save();
    }
  } else {
    // Hard delete: only sender can do it
    if (message.sender.toString() !== userId.toString()) {
      throw new ApiError(403, "Only the sender can delete this message for everyone");
    }
    await messageModel.findByIdAndDelete(messageId);
  }

  return true;
};

// EDIT MESSAGE
let editMessageService = async (messageId, userId, newContent) => {
  if (!newContent || !newContent.trim()) {
    throw new ApiError(400, "Message content is required");
  }

  let message = await messageModel.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.sender.toString() !== userId.toString()) {
    throw new ApiError(403, "Only the sender can edit this message");
  }

  if (message.messageType === "system") {
    throw new ApiError(400, "System messages cannot be edited");
  }

  message.message = newContent.trim();
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save();

  const populated = await message.populate("sender", "name email tier");
  return populated;
};

// REACT TO MESSAGE
let reactMessageService = async (messageId, userId, emoji) => {
  if (!emoji || !emoji.trim()) {
    throw new ApiError(400, "Emoji is required");
  }

  let message = await messageModel.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // check team membership to ensure authorization
  let team = await teamModel.findById(message.team);
  if (!team) {
    throw new ApiError(404, "Team associated with the message not found");
  }

  let isMember = team.members.some(
    (member) => member?.userId?.toString() === userId.toString(),
  );
  if (!isMember) {
    throw new ApiError(403, "Only team members can react to messages");
  }

  // Find if reaction already exists
  const existingReactionIndex = message.reactions.findIndex(
    (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
  );

  if (existingReactionIndex > -1) {
    // Remove reaction (toggle off)
    message.reactions.splice(existingReactionIndex, 1);
  } else {
    // Add reaction
    message.reactions.push({ userId, emoji });
  }

  await message.save();
  const populated = await message.populate("sender", "name email tier");
  return populated;
};

// GET UNREAD MESSAGE COUNT
let getUnreadMessageCountService = async (teamId, userId) => {
  let team = await teamModel.findById(teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  let memberInfo = team.members.find(
    (m) => m?.userId?.toString() === userId.toString()
  );

  if (!memberInfo) {
    throw new ApiError(403, "Only team members can view unread count");
  }

  const lastReadAt = memberInfo.lastReadAt || memberInfo.joinedAt || new Date(0);

  const unreadCount = await messageModel.countDocuments({
    team: teamId,
    sender: { $ne: userId },
    createdAt: { $gt: lastReadAt },
    deletedFor: { $ne: userId }
  });

  return { unreadCount };
};

module.exports = {
  sendMessageService,
  getTeamMessagesService,
  deleteMessageService,
  editMessageService,
  reactMessageService,
  getUnreadMessageCountService,
};
