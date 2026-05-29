const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const Task = require("../models/Task");
const Team = require("../models/team.model");

// POST /api/tasks/:teamId
const createTask = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { title, description, assignedTo, status, priority, dueDate } = req.body;
  const userId = req.user._id;

  if (!title || !title.trim()) {
    throw new ApiError(400, "Task title is required");
  }

  // Double check that assignee is a team member if assignedTo is provided
  if (assignedTo) {
    const team = req.team || await Team.findById(teamId);
    const isAssigneeMember = team.members.some(
      (m) => m?.userId?.toString() === assignedTo.toString()
    );
    if (!isAssigneeMember) {
      throw new ApiError(400, "Assignee must be a member of the team");
    }
  }

  const task = await Task.create({
    teamId,
    title: title.trim(),
    description: description ? description.trim() : "",
    assignedTo: assignedTo || null,
    status: status || "todo",
    priority: priority || "medium",
    dueDate: dueDate || null,
    createdBy: userId,
  });

  const populated = await task.populate([
    { path: "assignedTo", select: "name email" },
    { path: "createdBy", select: "name" }
  ]);

  return res
    .status(201)
    .json(new ApiResponse("Task created successfully", populated));
});

// GET /api/tasks/:teamId
const getTasks = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { status, assignedTo, priority } = req.query;

  const query = { teamId };

  if (status) query.status = status;
  if (assignedTo) query.assignedTo = assignedTo;
  if (priority) query.priority = priority;

  const tasks = await Task.find(query)
    .populate("assignedTo", "name email")
    .populate("createdBy", "name")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse("Tasks fetched successfully", tasks));
});

// PATCH /api/tasks/:taskId
const updateTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { title, description, assignedTo, status, priority, dueDate } = req.body;

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (title !== undefined) {
    if (!title.trim()) throw new ApiError(400, "Title cannot be empty");
    task.title = title.trim();
  }

  if (description !== undefined) {
    task.description = description.trim();
  }

  if (assignedTo !== undefined) {
    if (assignedTo) {
      const team = await Team.findById(task.teamId);
      const isAssigneeMember = team.members.some(
        (m) => m?.userId?.toString() === assignedTo.toString()
      );
      if (!isAssigneeMember) {
        throw new ApiError(400, "Assignee must be a member of the team");
      }
      task.assignedTo = assignedTo;
    } else {
      task.assignedTo = null;
    }
  }

  if (status !== undefined) {
    if (!["todo", "inprogress", "done"].includes(status)) {
      throw new ApiError(400, "Invalid status");
    }
    task.status = status;
  }

  if (priority !== undefined) {
    if (!["low", "medium", "high"].includes(priority)) {
      throw new ApiError(400, "Invalid priority");
    }
    task.priority = priority;
  }

  if (dueDate !== undefined) {
    task.dueDate = dueDate || null;
  }

  await task.save();

  const populated = await task.populate([
    { path: "assignedTo", select: "name email" },
    { path: "createdBy", select: "name" }
  ]);

  return res
    .status(200)
    .json(new ApiResponse("Task updated successfully", populated));
});

// DELETE /api/tasks/:taskId
const deleteTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  await Task.findByIdAndDelete(taskId);

  return res
    .status(200)
    .json(new ApiResponse("Task deleted successfully", {}));
});

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
};
