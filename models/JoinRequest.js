const mongoose = require("mongoose");

const joinRequestSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appliedRole: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },
    seenByLeader: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const JoinRequest = mongoose.model("JoinRequest", joinRequestSchema);
module.exports = JoinRequest;
