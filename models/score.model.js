// models/score.model.js

const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    githubData: {
      repos: {
        type: Number,
        default: 0,
      },

      commits: {
        type: Number,
        default: 0,
      },

      stars: {
        type: Number,
        default: 0,
      },

      prs: {
        type: Number,
        default: 0,
      },

      topLanguages: [
        {
          type: String,
          trim: true,
        },
      ],
    },

    leetcodeData: {
      rating: {
        type: Number,
        default: 0,
      },

      solved: {
        type: Number,
        default: 0,
      },

      easySolved: {
        type: Number,
        default: 0,
      },

      mediumSolved: {
        type: Number,
        default: 0,
      },

      hardSolved: {
        type: Number,
        default: 0,
      },

      rank: {
        type: Number,
        default: 0,
      },
    },

    cfData: {
      rating: {
        type: Number,
        default: 0,
      },

      rank: {
        type: String,
        default: "",
        trim: true,
      },

      maxRating: {
        type: Number,
        default: 0,
      },
    },

    deployedProjects: [
      {
        title: {
          type: String,
          default: "",
          trim: true,
        },

        url: {
          type: String,
          required: true,
          trim: true,
        },

        lastChecked: {
          type: Date,
          default: null,
        },

        isLive: {
          type: Boolean,
          default: false,
        },
      },
    ],

    roleScores: {
      frontend: {
        type: Number,
        default: 0,
      },

      backend: {
        type: Number,
        default: 0,
      },

      fullstack: {
        type: Number,
        default: 0,
      },

      dsa: {
        type: Number,
        default: 0,
      },

      ai: {
        type: Number,
        default: 0,
      },

      design: {
        type: Number,
        default: 0,
      },
    },

    totalScore: {
      type: Number,
      default: 0,
    },

    tier: {
      type: String,
      enum: ["Beginner", "Builder", "ProBuilder", "Elite"],
      default: "Beginner",
    },

    scanHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },

        totalScore: {
          type: Number,
          default: 0,
        },

        githubScore: {
          type: Number,
          default: 0,
        },

        leetcodeScore: {
          type: Number,
          default: 0,
        },

        cfScore: {
          type: Number,
          default: 0,
        },

        projectsScore: {
          type: Number,
          default: 0,
        },
      },
    ],

    lastScanAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ScoreModel = mongoose.model("Score", scoreSchema);

module.exports = ScoreModel;