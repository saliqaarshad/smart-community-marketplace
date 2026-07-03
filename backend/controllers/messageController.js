const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// @desc    Start or get an existing conversation with another user
// @route   POST /api/conversations
const startConversation = async (req, res) => {
  try {
    const { recipientId, listingType, listingId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'recipientId is required' });
    }

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot start a conversation with yourself' });
    }

    const query = {
      participants: { $all: [req.user._id, recipientId], $size: 2 },
    };

    if (listingId) {
      query.listing = listingId;
    } else {
      query.listing = null;
    }

    let conversation = await Conversation.findOne(query);

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
        listingType: listingType || null,
        listing: listingId || null,
      });
    }

    const populatedConversation = await Conversation.findById(conversation._id).populate(
      'participants',
      'fullName profilePicture'
    );

    res.status(201).json({ success: true, data: populatedConversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all conversations for the logged-in user
// @route   GET /api/conversations
const getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'fullName profilePicture')
      .sort({ lastMessageAt: -1 });

    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all messages in a conversation
// @route   GET /api/conversations/:id/messages
const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'fullName profilePicture')
      .sort({ createdAt: 1 });

    // Mark messages as read (all messages not sent by current user)
    await Message.updateMany(
      { conversation: req.params.id, sender: { $ne: req.user._id }, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { startConversation, getMyConversations, getMessages };