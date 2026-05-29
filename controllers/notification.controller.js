const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const Notification = require("../models/Notification");

// GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("sender", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments({ recipient: req.user._id });

  return res.status(200).json(
    new ApiResponse("Notifications fetched successfully", {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  );
});

// PATCH /api/notifications/read/:id
const markOneRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to update this notification");
  }

  notification.isRead = true;
  await notification.save();

  return res
    .status(200)
    .json(new ApiResponse("Notification marked as read", {}));
});

// PATCH /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  return res
    .status(200)
    .json(new ApiResponse("All notifications marked as read", {}));
});

// DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to delete this notification");
  }

  await Notification.findByIdAndDelete(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse("Notification deleted successfully", {}));
});

// GET /api/notifications/unread-count
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  return res
    .status(200)
    .json(new ApiResponse("Unread count fetched successfully", { count }));
});

module.exports = {
  getNotifications,
  markOneRead,
  markAllRead,
  deleteNotification,
  getUnreadCount,
};
