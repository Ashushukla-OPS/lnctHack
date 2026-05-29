const Team = require("../models/team.model");
const ApiError = require("../utils/apiError");

const isSlotAvailable = async (teamId, role) => {
  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  const slot = team.openSlots.find((s) => s.role === role && !s.filled);
  return !!slot;
};

const fillSlot = async (teamId, role, userId) => {
  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  const slot = team.openSlots.find((s) => s.role === role && !s.filled);
  if (!slot) {
    throw new ApiError(400, `No unfilled slot found for role ${role}`);
  }

  slot.filled = true;
  slot.filledBy = userId;
  await team.save();
  return true;
};

const reopenSlot = async (teamId, role) => {
  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  const slot = team.openSlots.find((s) => s.role === role && s.filled);
  if (!slot) {
    const anySlot = team.openSlots.find((s) => s.role === role);
    if (!anySlot) {
      throw new ApiError(400, `No slot found for role ${role}`);
    }
    anySlot.filled = false;
    anySlot.filledBy = null;
  } else {
    slot.filled = false;
    slot.filledBy = null;
  }

  await team.save();
  return true;
};

const incrementPending = async (teamId, role) => {
  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  const slot = team.openSlots.find((s) => s.role === role && !s.filled);
  if (!slot) {
    throw new ApiError(400, `No open slot found for role ${role}`);
  }

  slot.pendingRequestsCount = (slot.pendingRequestsCount || 0) + 1;
  await team.save();
  return true;
};

const decrementPending = async (teamId, role) => {
  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  const slot = team.openSlots.find((s) => s.role === role);
  if (!slot) {
    throw new ApiError(400, `No slot found for role ${role}`);
  }

  slot.pendingRequestsCount = Math.max(0, (slot.pendingRequestsCount || 0) - 1);
  await team.save();
  return true;
};

module.exports = {
  isSlotAvailable,
  fillSlot,
  reopenSlot,
  incrementPending,
  decrementPending,
};
