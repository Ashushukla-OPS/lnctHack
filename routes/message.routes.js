const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const isTeamMember = require("../middleware/isTeamMember");
const {
  sendMessageController,
  getTeamMessagesController,
  deleteMessageController,
  editMessageController,
  reactMessageController,
  getUnreadMessageCountController,
} = require("../controllers/message.controller");

const router = express.Router();

// GET UNREAD COUNT (Must be declared before GET /:teamId to avoid conflict)
router.get("/unread/:teamId", authMiddleware, isTeamMember, getUnreadMessageCountController);

// GET TEAM MESSAGES
router.get("/:teamId", authMiddleware, isTeamMember, getTeamMessagesController);

// SEND MESSAGE TO TEAM
router.post("/send/:teamId", authMiddleware, isTeamMember, sendMessageController);

// DELETE MESSAGE (Soft or Hard)
router.delete("/:messageId", authMiddleware, isTeamMember, deleteMessageController);

// EDIT MESSAGE
router.patch("/edit/:messageId", authMiddleware, isTeamMember, editMessageController);

// REACT TO MESSAGE
router.post("/react/:messageId", authMiddleware, isTeamMember, reactMessageController);

module.exports = router;
