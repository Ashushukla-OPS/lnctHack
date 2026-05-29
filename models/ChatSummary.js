const mongoose = require("mongoose");

const chatSummarySchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    summaryType: {
      type: String,
      enum: ["project_summary", "new_member_brief", "progress_report"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    messageCountAt: {
      type: Number,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isStale: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for fast lookups
chatSummarySchema.index({ teamId: 1, summaryType: 1 }, { unique: true });

const ChatSummary = mongoose.model("ChatSummary", chatSummarySchema);
module.exports = ChatSummary;
