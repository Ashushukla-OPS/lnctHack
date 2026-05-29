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

        lastReadAt: {
          type: Date,
          default: Date.now,
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
        minScore: {
          type: Number,
          default: 0,
        },
        requiredSkills: [
          {
            type: String,
            trim: true,
          },
        ],
        filled: {
          type: Boolean,
          default: false,
        },
        filledBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        pendingRequestsCount: {
          type: Number,
          default: 0,
        },
      },
    ],

    maxMembers: {
      type: Number,
      default: 5,
    },

    chemistryScore: {
      type: Number,
      default: null,
    },

    chemistryNote: {
      type: String,
      default: "",
    },

    chemistryUpdatedAt: {
      type: Date,
      default: null,
    },

    chemistryData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    skillGapUpdatedAt: {
      type: Date,
      default: null,
    },

    skillGapData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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

teamSchema.pre("save", function () {
  if (this.isModified("members")) {
    this.chemistryScore = null;
    this.chemistryNote = "";
    this.chemistryUpdatedAt = null;
    this.chemistryData = null;
    this.skillGapUpdatedAt = null;
    this.skillGapData = null;
  }
  if (this.isModified("openSlots")) {
    this.skillGapUpdatedAt = null;
    this.skillGapData = null;
  }
});

const TeamModel = mongoose.model("Team", teamSchema);

module.exports = TeamModel;

