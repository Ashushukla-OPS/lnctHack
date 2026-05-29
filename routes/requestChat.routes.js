const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const isRequestParticipant = require("../middleware/isRequestParticipant");
const {
  sendMessage,
  getMessages,
  markMessagesRead,
} = require("../controllers/requestChat.controller");

// Send message in pre-approval chat
router.post("/send/:requestId", authMiddleware, isRequestParticipant, sendMessage);

// Get messages in pre-approval chat
router.get("/:requestId", authMiddleware, isRequestParticipant, getMessages);

// Mark all messages as read
router.patch("/read/:requestId", authMiddleware, isRequestParticipant, markMessagesRead);

module.exports = router;
