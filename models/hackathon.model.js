const mongoose = require("mongoose");

const hackathonSchema = new mongoose.Schema(
  {
    name:{
      type: String,
      required: true,
      trim: true,
    },

    organizer:{
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    submissionDeadline: {
      type: Date,
      required: true,
    },

    mode: {
      type: String,
      enum: ["online", "offline"],
      required: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    registeredStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],

    maxTeamSize: {
      type: Number,
      default: 5,
    },

    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
  },
  {
    timestamps: true,
  }
);

const HackathonModel = mongoose.model("Hackathon", hackathonSchema);

module.exports = HackathonModel;