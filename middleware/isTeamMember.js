const Team = require("../models/team.model");
const Task = require("../models/Task");
const Message = require("../models/message.model");
const ApiError = require("../utils/apiError");

const isTeamMember = async (req, res, next) => {
  try {
    let teamId = req.params?.teamId || req.body?.teamId || req.params?.id;

    // Resolve from taskId if needed
    if (!teamId && req.params.taskId) {
      const task = await Task.findById(req.params.taskId);
      if (!task) throw new ApiError(404, "Task not found");
      teamId = task.teamId;
    }

    // Resolve from messageId if needed
    if (!teamId && req.params.messageId) {
      const message = await Message.findById(req.params.messageId);
      if (!message) throw new ApiError(404, "Message not found");
      teamId = message.team;
    }

    if (!teamId) {
      throw new ApiError(400, "Team context not found");
    }

    const team = await Team.findById(teamId);
    if (!team) {
      throw new ApiError(404, "Team not found");
    }

    const isMember = team.members.some(
      (member) => member.userId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      throw new ApiError(403, "Only team members can do this");
    }

    req.team = team;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = isTeamMember;
