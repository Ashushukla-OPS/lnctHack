const asyncHandler = require("../utils/asyncHandler");

const {
  createTeamService,
  getAllTeamsService,
  getSingleTeamService,
  deleteTeamService,
} = require("../services/team.service");



// CREATE TEAM
let createTeamController = asyncHandler(
  async (req, res) => {

    let team = await createTeamService(
      req.user._id,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Team created successfully",
      team,
    });
  }
);




// GET ALL TEAMS
let getAllTeamsController = asyncHandler(
  async (req, res) => {

    let teams = await getAllTeamsService();

    return res.status(200).json({
      success: true,
      totalTeams: teams.length,
      teams,
    });
  }
);




// GET SINGLE TEAM
let getSingleTeamController = asyncHandler(
  async (req, res) => {

    let { id } = req.params;

    let team = await getSingleTeamService(id);

    return res.status(200).json({
      success: true,
      team,
    });
  }
);




// DELETE TEAM
let deleteTeamController = asyncHandler(
  async (req, res) => {

    let { id } = req.params;

    await deleteTeamService(
      id,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      message: "Team deleted successfully",
    });
  }
);




module.exports = {
  createTeamController,
  getAllTeamsController,
  getSingleTeamController,
  deleteTeamController,
};