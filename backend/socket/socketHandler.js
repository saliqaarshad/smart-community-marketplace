const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const createNotification = require('../utils/createNotification');

const onlineUsers = new Map(); // userId -> socketId

const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication error: no token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) return next(new Error('Authentication error: user not found'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);
    console.log(`User connected: ${socket.user.fullName} (${socket.id})`);

    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
    });

    socket.on('sendMessage', async ({ conversationId, text, image }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userId
        );
        if (!isParticipant) return;

        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          text: text || '',
          image: image || undefined,
        });

        conversation.lastMessage = text || (image ? 'Sent an image' : '');
        conversation.lastMessageAt = new Date();
        await conversation.save();

        const populatedMessage = await Message.findById(message._id).populate(
          'sender',
          'fullName profilePicture'
        );

        io.to(conversationId).emit('newMessage', populatedMessage);

        const recipientId = conversation.participants.find((p) => p.toString() !== userId);
        if (recipientId && !onlineUsers.has(recipientId.toString())) {
          await createNotification({
            recipient: recipientId,
            type: 'new_message',
            title: 'New Message',
            message: `${socket.user.fullName} sent you a message`,
            relatedId: conversationId,
          });
        }
      } catch (error) {
        socket.emit('errorMessage', { message: error.message });
      }
    });

    socket.on('typing', ({ conversationId }) => {
      socket.to(conversationId).emit('userTyping', { userId, fullName: socket.user.fullName });
    });

    socket.on('stopTyping', ({ conversationId }) => {
      socket.to(conversationId).emit('userStoppedTyping', { userId });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      console.log(`User disconnected: ${socket.user.fullName}`);
    });
  });
};

module.exports = initializeSocket;