const cron = require("node-cron");
const HackathonModel = require("../models/hackathon.model");
const Team = require("../models/team.model");
const Notification = require("../models/Notification");
const { createNotification } = require("./notificationService");

const initCronJobs = () => {
  console.log("Initializing cron jobs...");

  // Run every hour: "0 * * * *"
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("Running hourly hackathon deadline check...");
      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find ongoing hackathons where the submission deadline is within the next 24 hours
      const hackathons = await HackathonModel.find({
        startDate: { $lte: now },
        submissionDeadline: { $gt: now, $lte: twentyFourHoursFromNow },
        status: { $ne: "completed" },
      });

      for (const hackathon of hackathons) {
        // Find all teams registered in this hackathon
        const teams = await Team.find({ hackathonId: hackathon._id });

        for (const team of teams) {
          for (const member of team.members) {
            // Check if we already sent a reminder to this user for this team in the last 24 hours
            const existingNotification = await Notification.findOne({
              recipient: member.userId,
              type: "deadline_reminder",
              relatedTeam: team._id,
              createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
            });

            if (!existingNotification) {
              await createNotification({
                recipient: member.userId,
                type: "deadline_reminder",
                message: `Reminder: Hackathon "${hackathon.name}" submission deadline is in less than 24 hours! Make sure your team completes and submits on time.`,
                relatedTeam: team._id,
              });
              console.log(`Sent deadline reminder to user ${member.userId} in team ${team.teamName}`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error running hackathon deadline cron job:", error);
    }
  });
};

module.exports = { initCronJobs };
