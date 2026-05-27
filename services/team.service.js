const teamModel = require("../models/team.model");

const ApiError = require("../utils/apiError");



//Create Team
let createTeamService = async (
  userId,
  data
) => {

  let {
    teamName,
    description,
    hackathonId,
    openSlots,
    maxMembers,
  } = data;

  // required only these
  if (!teamName || !description) {
    throw new ApiError(
      400,
      "Team name and description are required"
    );
  }

  let newTeam = await teamModel.create({

    teamName,

    description,

    // optional
    hackathonId: hackathonId || null,

    leader: userId,

    members: [
      {
        userId,
        role: "Leader",
        commitmentSigned: true,
      },
    ],

    // optional
    openSlots: openSlots || [],

    // optional
    maxMembers: maxMembers || 5,
  });

  return newTeam;
};





// GET ALL TEAMS
let getAllTeamsService = async () => {

  let teams = await teamModel

    .find()

    .populate(
      "leader",
      "name email tier"
    )

    .populate(
      "members.userId",
      "name email tier"
    )

    .populate(
      "taskBoard.assignee",
      "name email"
    );

  return teams;
};







// GET SINGLE TEAM
let getSingleTeamService = async (
  teamId
) => {

  let team = await teamModel

    .findById(teamId)

    .populate(
      "leader",
      "name email bio tier"
    )

    .populate(
      "members.userId",
      "name email bio tier skills"
    )

    .populate(
      "taskBoard.assignee",
      "name email"
    );

  // team not found
  if (!team) {
    throw new ApiError(
      404,
      "Team not found"
    );
  }

  return team;
};








// DELETE TEAM
let deleteTeamService = async (
  teamId,
  userId
) => {

  // find team
  let team = await teamModel.findById(teamId);

  // team not found
  if (!team) {
    throw new ApiError(
      404,
      "Team not found"
    );
  }

  // only leader can delete
  if (
    team.leader.toString() !==
    userId.toString()
  ) {
    throw new ApiError(
      403,
      "Only leader can delete team"
    );
  }

  // delete team
  await teamModel.findByIdAndDelete(teamId);

  return true;
};






module.exports = {
  createTeamService,
  getAllTeamsService,
  getSingleTeamService,
  deleteTeamService,
};