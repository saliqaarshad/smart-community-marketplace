const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    listingType: {
      type: String,
      enum: ['Product', 'Service', null],
      default: null,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'listingType',
      default: null,
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevent duplicate conversations between the same 2 participants for the same listing
conversationSchema.index({ participants: 1, listing: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);