const Team = require("../models/team.model");
const JoinRequest = require("../models/JoinRequest");
const Task = require("../models/Task");
const ApiError = require("../utils/apiError");

const isTeamLeader = async (req, res, next) => {
  try {
    let teamId = req.params.teamId || req.body.teamId;

    // Resolve teamId from params.id if teamId is not directly provided
    if (!teamId && req.params.id) {
      const team = await Team.findById(req.params.id);
      if (team) {
        teamId = team._id;
      } else {
        const request = await JoinRequest.findById(req.params.id);
        if (request) {
          teamId = request.team;
        }
      }
    }

    // Resolve from taskId if needed
    if (!teamId && req.params.taskId) {
      const task = await Task.findById(req.params.taskId);
      if (task) {
        teamId = task.teamId;
      }
    }

    if (!teamId) {
      throw new ApiError(400, "Team context not found");
    }

    const team = await Team.findById(teamId);
    if (!team) {
      throw new ApiError(404, "Team not found");
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Only team leader can do this");
    }

    req.team = team;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = isTeamLeader;
