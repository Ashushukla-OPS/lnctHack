const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
   
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    refreshToken: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    
    education: {
      institutionName: {
        type: String,
        default: "",
        trim: true,
      },

      institutionType: {
        type: String,
        enum: ["school", "college", "university", "other"],
        default: "college",
      },

      degree: {
        type: String,
        default: "",
        trim: true,
      },

      branch: {
        type: String,
        default: "",
        trim: true,
      },

      year: {
        type: String,
        enum: ["1st", "2nd", "3rd", "4th", "5th", "passout", ""],
        default: "",
      },

      graduationYear: {
        type: Number,
        default: null,
      },
    },

  
    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    github: {
      type: String,
      default: "",
      trim: true,
    },

    leetcode: {
      type: String,
      default: "",
      trim: true,
    },

    codeforces: {
      type: String,
      default: "",
      trim: true,
    },

  
    scores: {
    
      github: {
        type: Number,
        default: 0,
      },

      leetcode: {
        type: Number,
        default: 0,
      },

      cf: {
        type: Number,
        default: 0,
      },

      projects: {
        type: Number,
        default: 0,
      },

      linkedin: {
        type: Number,
        default: 0,
      },

   
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

      
      total: {
        type: Number,
        default: 0,
      },
    },

    tier: {
      type: String,
      enum: ["Beginner", "Builder", "ProBuilder", "Elite"],
      default: "Beginner",
    },

    verificationStatus: {
      type: String,
      enum: ["unverified", "partial", "verified"],
      default: "unverified",
    },

  
    hackathonsCompleted: {
      type: Number,
      default: 0,
    },

    hackathonsCancelled: {
      type: Number,
      default: 0,
    },

    lastMinuteDropouts: {
      type: Number,
      default: 0,
    },

    preferenceScore: {
      type: Number,
      default: 0,
    },

    
    isOpenToTeam: {
      type: Boolean,
      default: true,
    },

    availability: {
      type: String,
      enum: ["available", "busy", "weekends", "not_available"],
      default: "available",
    },

  
    lastScanAt: {
      type: Date,
      default: null,
    },

    reputationScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 200,
    },

    totalTeamsJoined: {
      type: Number,
      default: 0,
    },

    totalDropouts: {
      type: Number,
      default: 0,
    },

    isBlacklisted: {
      type: Boolean,
      default: false,
    },

    blacklistedReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;