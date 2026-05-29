const mongoose = require("mongoose");
require("dotenv").config();
const HackathonModel = require("../models/hackathon.model");

const seedHackathons = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/provenstack";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully");

    // Clean existing
    await HackathonModel.deleteMany({});
    console.log("Cleared existing hackathons");

    const now = new Date();
    const futureDate = (days) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d;
    };

    const seedData = [
      {
        name: "Smart India Hackathon",
        organizer: "Ministry of Education",
        description: "India's largest nationwide hackathon for solving real-world challenges.",
        startDate: futureDate(2),
        endDate: futureDate(4),
        submissionDeadline: futureDate(3.5),
        mode: "offline",
        location: "LNCT Bhopal Campus",
        maxTeamSize: 6,
      },
      {
        name: "BuildVerse Hackathon",
        organizer: "Devfolio",
        description: "An intensive 48-hour buildathon targeting Web3, AI, and SaaS applications.",
        startDate: futureDate(5),
        endDate: futureDate(7),
        submissionDeadline: futureDate(6.5),
        mode: "online",
        location: "",
        maxTeamSize: 4,
      },
      {
        name: "HackForge 2026",
        organizer: "GitHub",
        description: "Collaborative developer event centered on open-source scaling and tools.",
        startDate: futureDate(10),
        endDate: futureDate(12),
        submissionDeadline: futureDate(11.5),
        mode: "online",
        location: "",
        maxTeamSize: 5,
      },
      {
        name: "AI Innovation Challenge",
        organizer: "Google Cloud",
        description: "Build cutting-edge products using generative AI models and Google Cloud platform services.",
        startDate: futureDate(1),
        endDate: futureDate(3),
        submissionDeadline: futureDate(2.5),
        mode: "offline",
        location: "Bhopal IT Park",
        maxTeamSize: 5,
      },
      {
        name: "CodeSprint 2026",
        organizer: "HackerRank",
        description: "Speed-coding and algorithmic optimization hackathon for individuals and teams.",
        startDate: futureDate(15),
        endDate: futureDate(17),
        submissionDeadline: futureDate(16.5),
        mode: "online",
        location: "",
        maxTeamSize: 3,
      }
    ];

    const result = await HackathonModel.insertMany(seedData);
    console.log(`Successfully seeded ${result.length} hackathons!`);
  } catch (err) {
    console.error("Database seeding failed:", err);
  } finally {
    await mongoose.disconnect();
  }
};

seedHackathons();
