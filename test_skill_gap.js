require("dotenv").config();
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const Team = require("./models/team.model");
const User = require("./models/user.model");
const { generateTeamSkillGapService } = require("./services/aiSkillGap.service");

async function runTest() {
  console.log("Connecting to MongoDB...");
  await connectDB();

  // 1. Create dummy users
  console.log("Creating dummy users...");
  const user1 = await User.create({
    name: "Charlie React",
    email: `charlie_${Date.now()}@provenstack.dev`,
    password: "Password@123",
    skills: ["React", "HTML", "CSS", "UI/UX"],
    tier: "Builder",
    reputationScore: 90
  });

  const user2 = await User.create({
    name: "Dev Node",
    email: `dev_${Date.now()}@provenstack.dev`,
    password: "Password@123",
    skills: ["Node.js", "Express", "REST APIs"],
    tier: "Elite",
    reputationScore: 95
  });

  console.log(`Created users:\n - ${user1.name} (${user1._id})\n - ${user2.name} (${user2._id})`);

  // 2. Create team with open slots
  console.log("Creating dummy team with open slots...");
  const team = await Team.create({
    teamName: "Web Explorers",
    description: "Creating a stunning hackathon dashboard",
    leader: user1._id,
    members: [
      { userId: user1._id, role: "Frontend Developer", commitmentSigned: true },
      { userId: user2._id, role: "Backend Developer", commitmentSigned: true }
    ],
    openSlots: [
      {
        role: "Database Engineer",
        minScore: 0,
        requiredSkills: ["MongoDB", "Redis", "Mongoose"],
        filled: false
      },
      {
        role: "DevOps Engineer",
        minScore: 0,
        requiredSkills: ["Docker", "AWS", "CI/CD"],
        filled: false
      }
    ],
    maxMembers: 5
  });

  console.log(`Created team: ${team.teamName} (${team._id}) with ${team.members.length} members and ${team.openSlots.length} open slots.`);

  try {
    // 3. Test authorization check (unauthorized user → 403)
    console.log("\n--- Testing authorization (requesting as non-member) ---");
    const fakeUserId = new mongoose.Types.ObjectId();
    try {
      await generateTeamSkillGapService(team._id, fakeUserId);
      console.log("❌ Failed: Service allowed unauthorized access");
    } catch (err) {
      console.log(`✅ Success: Caught expected error: [${err.statusCode}] ${err.message}`);
    }

    // 4. Test skill gap analysis (valid request)
    console.log("\n--- Testing skill gap analysis (valid request) ---");
    const startTime = Date.now();
    const result = await generateTeamSkillGapService(team._id, user1._id);
    const duration = Date.now() - startTime;
    console.log(`✅ Success: Analysis completed in ${duration}ms`);
    console.log("Result:", JSON.stringify(result, null, 2));

    // Verify cache fields saved on Team document
    const updatedTeam = await Team.findById(team._id);
    console.log("\n--- Verifying cached fields in MongoDB Team document ---");
    console.log(`skillGapUpdatedAt: ${updatedTeam.skillGapUpdatedAt}`);
    console.log(`skillGapData:`, JSON.stringify(updatedTeam.skillGapData, null, 2));

    if (updatedTeam.skillGapData !== null && updatedTeam.skillGapUpdatedAt !== null) {
      console.log("✅ Success: Team model skill gap cache populated correctly!");
    } else {
      console.log("❌ Failed: Team skill gap fields were not populated in database");
    }

    // 5. Test caching behavior (subsequent calls should be near-instantaneous)
    console.log("\n--- Testing skill gap cache (should be near-instantaneous) ---");
    const startTimeCache = Date.now();
    const resultCache = await generateTeamSkillGapService(team._id, user1._id);
    const durationCache = Date.now() - startTimeCache;
    console.log(`✅ Success: Cache hit fetched in ${durationCache}ms`);
    if (durationCache < 50) {
      console.log("✅ Success: Cache hit was extremely fast!");
    } else {
      console.log("⚠️ Warning: Cache hit took longer than expected");
    }

    // 6. Test Cache Invalidation when openSlots are modified
    console.log("\n--- Testing cache invalidation upon openSlots modification ---");
    updatedTeam.openSlots.push({
      role: "AI Specialist",
      minScore: 0,
      requiredSkills: ["TensorFlow", "Python"],
      filled: false
    });
    await updatedTeam.save();

    const teamAfterSlotChange = await Team.findById(team._id);
    console.log(`Open slots count now: ${teamAfterSlotChange.openSlots.length}`);
    console.log(`skillGapUpdatedAt after change (expect null): ${teamAfterSlotChange.skillGapUpdatedAt}`);
    console.log(`skillGapData after change (expect null): ${teamAfterSlotChange.skillGapData}`);

    if (teamAfterSlotChange.skillGapUpdatedAt === null && teamAfterSlotChange.skillGapData === null) {
      console.log("✅ Success: Skill gap cache was successfully invalidated/reset upon openSlots modification!");
    } else {
      console.log("❌ Failed: Skill gap cache was NOT invalidated upon openSlots modification!");
    }

  } catch (err) {
    console.error("❌ Unexpected test execution error:", err);
  } finally {
    // 7. Cleanup
    console.log("\nCleaning up dummy database records...");
    await Team.findByIdAndDelete(team._id);
    await User.findByIdAndDelete(user1._id);
    await User.findByIdAndDelete(user2._id);
    console.log("Cleanup complete!");
    mongoose.connection.close();
  }
}

runTest();
