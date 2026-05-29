const Notification = require("../models/Notification");

const createNotification = async ({
  recipient,
  sender,
  type,
  message,
  relatedRequest,
  relatedTeam,
}) => {
  const notification = await Notification.create({
    recipient,
    sender,
    type,
    message,
    relatedRequest: relatedRequest || null,
    relatedTeam: relatedTeam || null,
  });
  return notification;
};

module.exports = {
  createNotification,
};
