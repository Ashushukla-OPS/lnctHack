const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "join_interest",
        "request_accepted",
        "request_rejected",
        "new_message",
        "team_update",
        "member_left",
        "hackathon_reminder",
        "slot_filled",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JoinRequest",
    },
    relatedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
