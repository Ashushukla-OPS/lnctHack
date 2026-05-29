const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const {
  getNotifications,
  markOneRead,
  markAllRead,
  deleteNotification,
  getUnreadCount,
} = require("../controllers/notification.controller");

// Get all notifications (paginated)
router.get("/", authMiddleware, getNotifications);

// Get unread count  — must be before /:id to avoid conflict
router.get("/unread-count", authMiddleware, getUnreadCount);

// Mark all as read
router.patch("/read-all", authMiddleware, markAllRead);

// Mark single notification as read
router.patch("/read/:id", authMiddleware, markOneRead);

// Delete a notification
router.delete("/:id", authMiddleware, deleteNotification);

module.exports = router;
