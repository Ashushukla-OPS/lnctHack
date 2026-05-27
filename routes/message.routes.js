const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");

const {
  sendMessageController,
  getTeamMessagesController,
  deleteMessageController,
} = require("../controllers/message.controller");

const router = express.Router();

// SEND MESSAGE
router.post("/send/:teamId", authMiddleware, sendMessageController);

// GET TEAM MESSAGES
router.get("/:teamId", authMiddleware, getTeamMessagesController);

// DELETE MESSAGE
router.delete("/:messageId", authMiddleware, deleteMessageController);

module.exports = router;
