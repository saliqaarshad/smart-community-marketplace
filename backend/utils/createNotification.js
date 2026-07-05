const Notification = require('../models/Notification');

const createNotification = async ({ recipient, type, title, message, relatedId }) => {
  try {
    await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedId: relatedId || null,
    });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    // Intentionally not throwing - a failed notification shouldn't break the main action
  }
};

module.exports = createNotification;