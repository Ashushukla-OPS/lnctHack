const mongoose = require("mongoose");

const matchCacheSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
    unique: true
  },
  openSlots: [
    {
      role: String,
      requiredSkills: [String]
    }
  ],
  matches: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      name: String,
      tier: String,
      totalScore: Number,
      breakdown: {
        skillMatch: Number,
        locationMatch: Number,
        completionRate: Number,
        availability: Number
      },
      fitRating: String,
      whyGoodFit: String,
      concern: String,
      scores: {
        total: Number,
        github: Number,
        leetcode: Number,
        cf: Number
      },
      location: String,
      topLanguages: [String]
    }
  ],
  generatedAt: {
    type: Date,
    default: Date.now,
    expires: 1800 // TTL index: document will automatically expire after 30 minutes (1800 seconds)
  }
});

const MatchCache = mongoose.model("MatchCache", matchCacheSchema);
module.exports = MatchCache;
