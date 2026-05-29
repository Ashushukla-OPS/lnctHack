const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const ChatSummary = require("../models/ChatSummary");
const Team = require("../models/team.model");
const Message = require("../models/message.model");
const Task = require("../models/Task");
const Hackathon = require("../models/hackathon.model");
const geminiService = require("../services/geminiService");

const STALE_THRESHOLD = 20;

// Simple in-memory rate limiting for regeneration (max 5 per team per hour)
const regenHistory = {};

const checkRegenRateLimit = (teamId) => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  if (!regenHistory[teamId]) {
    regenHistory[teamId] = [];
  }

  // Filter out timestamps older than 1 hour
  regenHistory[teamId] = regenHistory[teamId].filter((t) => t > oneHourAgo);

  if (regenHistory[teamId].length >= 5) {
    return false;
  }

  regenHistory[teamId].push(now);
  return true;
};

// Reusable stale check logic
const getStaleStatus = async (teamId, summaryType) => {
  const currentMsgCount = await Message.countDocuments({ team: teamId });
  const existing = await ChatSummary.findOne({ teamId, summaryType });

  const isStale = !existing || (currentMsgCount - (existing.messageCountAt || 0)) >= STALE_THRESHOLD;
  return {
    existing,
    isStale,
    currentMsgCount,
  };
};

// Helper to fallback if Gemini fails
const handleGeminiFailure = (existing, error) => {
  if (existing) {
    console.error("Gemini failed. Returning last saved summary with fallback warnings:", error);
    // Add a marker warning to the saved summary content
    existing.content = `[⚠️ AI Service is temporarily offline. Showing cached report from ${new Date(existing.generatedAt).toLocaleString()}]\n\n${existing.content}`;
    return existing;
  }
  throw new ApiError(503, "AI service is currently unavailable. Please try again later.");
};

// GET /api/summary/:teamId/project
const getProjectSummary = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const team = req.team; // Resolved by isTeamMember

  const summaryType = "project_summary";
  const { existing, isStale, currentMsgCount } = await getStaleStatus(teamId, summaryType);

  if (!isStale && existing) {
    return res.status(200).json(
      new ApiResponse("Cached project summary fetched successfully", {
        summary: existing.content,
        generatedAt: existing.generatedAt,
        isStale: false,
        messageCountAt: existing.messageCountAt,
        freshlyGenerated: false,
      })
    );
  }

  // Fetch last 100 messages (chronological sort for context, populated with sender name)
  const messages = await Message.find({ team: teamId, messageType: { $ne: "system" } })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("sender", "name");

  messages.reverse(); // Bring back to chronological order

  try {
    const aiResponse = await geminiService.generateProjectSummary(messages, team.teamName);

    const summary = await ChatSummary.findOneAndUpdate(
      { teamId, summaryType },
      {
        content: aiResponse,
        messageCountAt: currentMsgCount,
        generatedBy: req.user._id,
        isStale: false,
        generatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return res.status(200).json(
      new ApiResponse("Project summary generated successfully", {
        summary: summary.content,
        generatedAt: summary.generatedAt,
        isStale: false,
        messageCountAt: summary.messageCountAt,
        freshlyGenerated: true,
      })
    );
  } catch (error) {
    const fallback = handleGeminiFailure(existing, error);
    return res.status(200).json(
      new ApiResponse("AI is currently offline. Returning last cached summary.", {
        summary: fallback.content,
        generatedAt: fallback.generatedAt,
        isStale: true,
        messageCountAt: fallback.messageCountAt,
        freshlyGenerated: false,
        error: true,
      })
    );
  }
});

// GET /api/summary/:teamId/new-member
const getNewMemberBrief = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const team = req.team;
  const userId = req.user._id;

  // Verify that the user joined in the last 24 hours
  const userMember = team.members.find((m) => m.userId.toString() === userId.toString());
  if (!userMember) {
    throw new ApiError(403, "Not a member of this team");
  }

  const joinTime = new Date(userMember.joinedAt).getTime();
  const timeElapsedMs = Date.now() - joinTime;
  const isNewMember = timeElapsedMs <= 24 * 60 * 60 * 1000;

  if (!isNewMember) {
    throw new ApiError(403, "This quick onboarding brief is only available within 24 hours of joining the team.");
  }

  const summaryType = "new_member_brief";
  const { existing, isStale, currentMsgCount } = await getStaleStatus(teamId, summaryType);

  // Fetch tasks snapshot to send alongside brief
  const tasks = await Task.find({ teamId }).populate("assignedTo", "name");

  if (!isStale && existing) {
    return res.status(200).json(
      new ApiResponse("Cached new member brief fetched successfully", {
        summary: existing.content,
        generatedAt: existing.generatedAt,
        isStale: false,
        messageCountAt: existing.messageCountAt,
        freshlyGenerated: false,
        tasks,
      })
    );
  }

  const messages = await Message.find({ team: teamId, messageType: { $ne: "system" } })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("sender", "name");

  messages.reverse();

  try {
    const aiResponse = await geminiService.generateNewMemberBrief(messages, team.teamName, tasks);

    const summary = await ChatSummary.findOneAndUpdate(
      { teamId, summaryType },
      {
        content: aiResponse,
        messageCountAt: currentMsgCount,
        generatedBy: req.user._id,
        isStale: false,
        generatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return res.status(200).json(
      new ApiResponse("New member brief generated successfully", {
        summary: summary.content,
        generatedAt: summary.generatedAt,
        isStale: false,
        messageCountAt: summary.messageCountAt,
        freshlyGenerated: true,
        tasks,
      })
    );
  } catch (error) {
    const fallback = handleGeminiFailure(existing, error);
    return res.status(200).json(
      new ApiResponse("AI is currently offline. Returning last cached onboarding brief.", {
        summary: fallback.content,
        generatedAt: fallback.generatedAt,
        isStale: true,
        messageCountAt: fallback.messageCountAt,
        freshlyGenerated: false,
        tasks,
        error: true,
      })
    );
  }
});

// GET /api/summary/:teamId/progress
const getProgressReport = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const team = req.team;
  const userId = req.user._id;

  // Only leader can view progress reports
  if (team.leader.toString() !== userId.toString()) {
    throw new ApiError(403, "Only the team leader can generate progress reports");
  }

  const summaryType = "progress_report";
  const { existing, isStale, currentMsgCount } = await getStaleStatus(teamId, summaryType);

  if (!isStale && existing) {
    return res.status(200).json(
      new ApiResponse("Cached progress report fetched successfully", {
        summary: existing.content,
        generatedAt: existing.generatedAt,
        isStale: false,
        messageCountAt: existing.messageCountAt,
        freshlyGenerated: false,
      })
    );
  }

  // Get tasks and hackathon details
  const tasks = await Task.find({ teamId }).populate("assignedTo", "name");
  let hackathonEndDate = "Not Scheduled";
  let hoursLeft = "N/A";

  if (team.hackathonId) {
    const hackathon = await Hackathon.findById(team.hackathonId);
    if (hackathon) {
      hackathonEndDate = hackathon.endDate.toLocaleString();
      const differenceMs = hackathon.endDate.getTime() - Date.now();
      hoursLeft = Math.max(0, Math.floor(differenceMs / 3600000));
    }
  }

  const messages = await Message.find({ team: teamId, messageType: { $ne: "system" } })
    .sort({ createdAt: -1 })
    .limit(40)
    .populate("sender", "name");

  messages.reverse();

  try {
    const aiResponse = await geminiService.generateProgressReport(
      messages,
      team.teamName,
      tasks,
      hackathonEndDate,
      hoursLeft
    );

    const summary = await ChatSummary.findOneAndUpdate(
      { teamId, summaryType },
      {
        content: aiResponse,
        messageCountAt: currentMsgCount,
        generatedBy: req.user._id,
        isStale: false,
        generatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return res.status(200).json(
      new ApiResponse("Progress report generated successfully", {
        summary: summary.content,
        generatedAt: summary.generatedAt,
        isStale: false,
        messageCountAt: summary.messageCountAt,
        freshlyGenerated: true,
      })
    );
  } catch (error) {
    const fallback = handleGeminiFailure(existing, error);
    return res.status(200).json(
      new ApiResponse("AI is currently offline. Returning last cached progress report.", {
        summary: fallback.content,
        generatedAt: fallback.generatedAt,
        isStale: true,
        messageCountAt: fallback.messageCountAt,
        freshlyGenerated: false,
        error: true,
      })
    );
  }
});

// POST /api/summary/:teamId/regenerate
const regenerateSummary = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { summaryType } = req.body;
  const team = req.team;
  const userId = req.user._id;

  if (!["project_summary", "new_member_brief", "progress_report"].includes(summaryType)) {
    throw new ApiError(400, "Invalid summary type requested");
  }

  // Leader only can force regeneration
  if (team.leader.toString() !== userId.toString()) {
    throw new ApiError(403, "Only the team leader can force manual summary regeneration");
  }

  // Rate Limiting check
  if (!checkRegenRateLimit(teamId)) {
    throw new ApiError(429, "Too many regenerations. Rate limit of 5 requests per hour exceeded.");
  }

  // Force stale status to update
  await ChatSummary.updateOne({ teamId, summaryType }, { $set: { isStale: true } });

  // Dynamically forward generation
  const currentMsgCount = await Message.countDocuments({ team: teamId });
  let aiResponse = "";

  if (summaryType === "project_summary") {
    const messages = await Message.find({ team: teamId, messageType: { $ne: "system" } })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("sender", "name");
    messages.reverse();
    aiResponse = await geminiService.generateProjectSummary(messages, team.teamName);
  } else if (summaryType === "new_member_brief") {
    const messages = await Message.find({ team: teamId, messageType: { $ne: "system" } })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "name");
    messages.reverse();
    const tasks = await Task.find({ teamId }).populate("assignedTo", "name");
    aiResponse = await geminiService.generateNewMemberBrief(messages, team.teamName, tasks);
  } else if (summaryType === "progress_report") {
    const messages = await Message.find({ team: teamId, messageType: { $ne: "system" } })
      .sort({ createdAt: -1 })
      .limit(40)
      .populate("sender", "name");
    messages.reverse();
    const tasks = await Task.find({ teamId }).populate("assignedTo", "name");
    let hackathonEndDate = "Not Scheduled";
    let hoursLeft = "N/A";

    if (team.hackathonId) {
      const hackathon = await Hackathon.findById(team.hackathonId);
      if (hackathon) {
        hackathonEndDate = hackathon.endDate.toLocaleString();
        const differenceMs = hackathon.endDate.getTime() - Date.now();
        hoursLeft = Math.max(0, Math.floor(differenceMs / 3600000));
      }
    }
    aiResponse = await geminiService.generateProgressReport(messages, team.teamName, tasks, hackathonEndDate, hoursLeft);
  }

  const summary = await ChatSummary.findOneAndUpdate(
    { teamId, summaryType },
    {
      content: aiResponse,
      messageCountAt: currentMsgCount,
      generatedBy: req.user._id,
      isStale: false,
      generatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return res.status(200).json(
    new ApiResponse("Summary regenerated successfully", {
      summary: summary.content,
      generatedAt: summary.generatedAt,
      isStale: false,
      messageCountAt: summary.messageCountAt,
      freshlyGenerated: true,
    })
  );
});

// GET /api/summary/:teamId/history
const getSummaryHistory = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  const summaries = await ChatSummary.find({ teamId })
    .select("summaryType generatedAt messageCountAt isStale")
    .sort({ generatedAt: -1 });

  return res.status(200).json(new ApiResponse("Summary history fetched successfully", summaries));
});

module.exports = {
  getProjectSummary,
  getNewMemberBrief,
  getProgressReport,
  regenerateSummary,
  getSummaryHistory,
};
