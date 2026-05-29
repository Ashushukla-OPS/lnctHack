const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const isTeamMember = require("../middleware/isTeamMember");
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} = require("../controllers/task.controller");

// Create a new task (req.params.teamId)
router.post("/:teamId", authMiddleware, isTeamMember, createTask);

// Get all tasks for a team (req.params.teamId)
router.get("/:teamId", authMiddleware, isTeamMember, getTasks);

// Update a task (req.params.taskId, resolved by isTeamMember)
router.patch("/:taskId", authMiddleware, isTeamMember, updateTask);

// Delete a task (req.params.taskId, resolved by isTeamMember)
router.delete("/:taskId", authMiddleware, isTeamMember, deleteTask);

module.exports = router;
