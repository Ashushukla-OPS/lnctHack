const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    teamName:{
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    hackathonId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      default: null,
    },

    leader:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        role: {
          type: String,
          required: true,
          trim: true,
        },

        joinedAt: {
          type: Date,
          default: Date.now,
        },

        commitmentSigned: {
          type: Boolean,
          default: false,
        },
      },
    ],

    openSlots: [
      {
        role: {
          type: String,
          required: true,
          trim: true,
        },

        skillType: {
          type: String,
          enum: [
            "frontend",
            "backend",
            "fullstack",
            "dsa",
            "ai",
            "design",
          ],
          required: true,
        },

        minScore: {
          type: Number,
          default: 0,
        },

        filled: {
          type: Boolean,
          default: false,
        },
      },
    ],

    maxMembers: {
      type: Number,
      default: 5,
    },

    chemistryScore: {
      type: Number,
      default: 0,
    },

    chemistryNote: {
      type: String,
      default: "",
    },

    contextDoc: {
      type: String,
      default: "",
    },

    taskBoard: [
      {
        task: {
          type: String,
          required: true,
          trim: true,
        },

        assignee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        done: {
          type: Boolean,
          default: false,
        },
      },
    ],

    status: {
      type: String,
      enum: ["forming", "active", "submitted", "completed", "closed"],
      default: "forming",
    },
  },
  {
    timestamps: true,
  }
);

const TeamModel = mongoose.model("Team", teamSchema);

module.exports = TeamModel;

