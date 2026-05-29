require("dotenv").config();
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const Team = require("./models/team.model");
const User = require("./models/user.model");
const { generateTeamChemistryService } = require("./services/aiChemistry.service");

async function runTest() {
  console.log("Connecting to MongoDB...");
  await connectDB();

  // 1. Create two dummy users with skills and scores
  console.log("Creating dummy users...");
  const user1 = await User.create({
    name: "Alice Developer",
    email: `alice_${Date.now()}@provenstack.dev`,
    password: "Password@123",
    skills: ["React", "CSS", "UI/UX", "JavaScript"],
    tier: "Expert",
    scores: { leetcode: 1800, cf: 1400, projects: 5 },
    reputationScore: 95
  });

  const user2 = await User.create({
    name: "Bob Architect",
    email: `bob_${Date.now()}@provenstack.dev`,
    password: "Password@123",
    skills: ["Node.js", "Express", "MongoDB", "AI", "Python"],
    tier: "Expert",
    scores: { leetcode: 2000, cf: 1600, projects: 8 },
    reputationScore: 98
  });

  console.log(`Created users:\n - ${user1.name} (${user1._id})\n - ${user2.name} (${user2._id})`);

  // 2. Create a team with Alice as leader and Bob as member
  console.log("Creating dummy team...");
  const team = await Team.create({
    teamName: "AI Dream Team",
    description: "Building the next generation AI coding assistant",
    leader: user1._id,
    members: [
      { userId: user1._id, role: "Frontend Lead", commitmentSigned: true },
      { userId: user2._id, role: "Backend Architect", commitmentSigned: true }
    ],
    maxMembers: 5
  });

  console.log(`Created team: ${team.teamName} (${team._id}) with ${team.members.length} members.`);

  try {
    // 3. Test authorization check (should fail with 403)
    console.log("\n--- Testing authorization (requesting as non-member) ---");
    const fakeUserId = new mongoose.Types.ObjectId();
    try {
      await generateTeamChemistryService(team._id, fakeUserId);
      console.log("❌ Failed: Service allowed unauthorized access");
    } catch (err) {
      console.log(`✅ Success: Caught expected error: [${err.statusCode}] ${err.message}`);
    }

    // 4. Test chemistry analysis (requesting as member/leader Alice)
    console.log("\n--- Testing chemistry analysis (valid request) ---");
    const startTime = Date.now();
    const result = await generateTeamChemistryService(team._id, user1._id);
    const duration = Date.now() - startTime;
    console.log(`✅ Success: Analysis completed in ${duration}ms`);
    console.log("Result:", JSON.stringify(result, null, 2));

    // Verify cache fields saved on Team document
    const updatedTeam = await Team.findById(team._id);
    console.log("\n--- Verifying cached fields in MongoDB Team document ---");
    console.log(`chemistryScore: ${updatedTeam.chemistryScore}`);
    console.log(`chemistryNote: ${updatedTeam.chemistryNote}`);
    console.log(`chemistryUpdatedAt: ${updatedTeam.chemistryUpdatedAt}`);
    console.log(`chemistryData:`, JSON.stringify(updatedTeam.chemistryData, null, 2));

    if (updatedTeam.chemistryScore !== null && updatedTeam.chemistryUpdatedAt !== null) {
      console.log("✅ Success: Team model chemistry cache populated correctly!");
    } else {
      console.log("❌ Failed: Team chemistry fields were not populated in database");
    }

    // 5. Test caching behavior (subsequent calls should be near-instantaneous)
    console.log("\n--- Testing chemistry cache (should be near-instantaneous) ---");
    const startTimeCache = Date.now();
    const resultCache = await generateTeamChemistryService(team._id, user1._id);
    const durationCache = Date.now() - startTimeCache;
    console.log(`✅ Success: Cache hit fetched in ${durationCache}ms`);
    if (durationCache < 50) {
      console.log("✅ Success: Cache hit was extremely fast!");
    } else {
      console.log("⚠️ Warning: Cache hit took longer than expected");
    }

    // 6. Test Cache Invalidation when a new member joins
    console.log("\n--- Testing cache invalidation upon member list modification ---");
    const user3 = await User.create({
      name: "Charlie Designer",
      email: `charlie_${Date.now()}@provenstack.dev`,
      password: "Password@123",
      skills: ["Figma", "UI/UX", "CSS"],
      tier: "Intermediate",
      scores: { leetcode: 1000, cf: 800, projects: 2 },
      reputationScore: 90
    });

    updatedTeam.members.push({
      userId: user3._id,
      role: "Lead Designer",
      commitmentSigned: true
    });
    await updatedTeam.save();

    const teamAfterJoin = await Team.findById(team._id);
    console.log(`Team members count now: ${teamAfterJoin.members.length}`);
    console.log(`chemistryScore after join (expect null): ${teamAfterJoin.chemistryScore}`);
    console.log(`chemistryUpdatedAt after join (expect null): ${teamAfterJoin.chemistryUpdatedAt}`);

    if (teamAfterJoin.chemistryScore === null && teamAfterJoin.chemistryUpdatedAt === null) {
      console.log("✅ Success: Chemistry cache was successfully invalidated/reset upon member join!");
    } else {
      console.log("❌ Failed: Chemistry cache was NOT invalidated upon member join!");
    }

    // Clean up Charlie
    await User.findByIdAndDelete(user3._id);

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
