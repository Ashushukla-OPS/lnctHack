const mongoose = require("mongoose");
require("dotenv").config();
const HackathonModel = require("../models/hackathon.model");

const checkDb = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/provenstack";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully");
    const count = await HackathonModel.countDocuments({});
    console.log(`Total hackathons in database: ${count}`);
    if (count === 0) {
      console.log("Database contains 0 hackathons.");
    } else {
      const all = await HackathonModel.find({}, "name organizer startDate");
      console.log("Seeded hackathons:", all);
    }
  } catch (err) {
    console.error("Database connection or query failed:", err);
  } finally {
    await mongoose.disconnect();
  }
};

checkDb();
