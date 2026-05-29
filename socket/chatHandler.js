const Meet = require("../models/Meet");
const Team = require("../models/team.model");

/**
 * Socket.io handlers for real-time team collaboration and video meetings
 */
module.exports = (io, socket) => {
  // Join a team's real-time chat room
  socket.on("join_team_chat", ({ teamId }) => {
    if (teamId) {
      socket.join(teamId);
      console.log(`Socket ${socket.id} joined team room: ${teamId}`);
    }
  });

  // Leave a team's real-time chat room
  socket.on("leave_team_chat", ({ teamId }) => {
    if (teamId) {
      socket.leave(teamId);
      console.log(`Socket ${socket.id} left team room: ${teamId}`);
    }
  });

  // Typing indicators
  socket.on("typing", ({ teamId, userName }) => {
    if (teamId) {
      socket.to(teamId).emit("user_typing", { userName });
    }
  });

  socket.on("stop_typing", ({ teamId, userName }) => {
    if (teamId) {
      socket.to(teamId).emit("user_stop_typing", { userName });
    }
  });

  // ==========================================
  // VIDEO MEET SOCKET.IO EVENTS
  // ==========================================

  // Join video meeting room
  socket.on("join-meet-room", async ({ roomId, userId, peerId, name }) => {
    try {
      if (!roomId || !userId || !peerId) return;

      const meet = await Meet.findOne({ roomId });
      if (!meet) return;

      if (meet.status === "ended") {
        socket.emit("error", { message: "Meet has ended" });
        return;
      }

      // Check membership
      const team = await Team.findById(meet.teamId);
      if (!team) return;

      const isMember = team.members.some(
        (member) => member.userId.toString() === userId.toString()
      );

      if (!isMember) {
        socket.emit("error", { message: "Only team members are allowed in this meeting" });
        return;
      }

      socket.join(roomId);
      console.log(`Socket ${socket.id} joined video meet room: ${roomId}`);

      // Upsert participant history
      const existingParticipant = meet.participants.find(
        (p) => p.userId.toString() === userId.toString()
      );

      if (existingParticipant) {
        existingParticipant.joinedAt = new Date();
        existingParticipant.leftAt = null;
      } else {
        meet.participants.push({
          userId,
          joinedAt: new Date(),
          leftAt: null,
        });
      }

      await meet.save();

      // Emit user-joined-meet to other members in the room
      socket.to(roomId).emit("user-joined-meet", { userId, peerId, name });
    } catch (error) {
      console.error("Error joining video meeting room:", error);
    }
  });

  // Leave video meeting room
  socket.on("leave-meet-room", async ({ roomId, userId }) => {
    try {
      if (!roomId || !userId) return;

      const meet = await Meet.findOne({ roomId });
      if (meet) {
        const participant = meet.participants.find(
          (p) => p.userId.toString() === userId.toString() && !p.leftAt
        );
        if (participant) {
          participant.leftAt = new Date();
          await meet.save();
        }
      }

      // Emit user-left-meet to other members in the room
      socket.to(roomId).emit("user-left-meet", { userId });
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left video meet room: ${roomId}`);
    } catch (error) {
      console.error("Error leaving video meeting room:", error);
    }
  });

  // Toggle Audio
  socket.on("toggle-audio", ({ roomId, userId, isMuted }) => {
    if (roomId && userId) {
      socket.to(roomId).emit("toggle-audio", { userId, isMuted });
    }
  });

  // Toggle Video
  socket.on("toggle-video", ({ roomId, userId, isVideoOff }) => {
    if (roomId && userId) {
      socket.to(roomId).emit("toggle-video", { userId, isVideoOff });
    }
  });
};
