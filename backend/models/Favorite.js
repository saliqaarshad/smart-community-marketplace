const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    listingType: {
      type: String,
      enum: ['Product', 'Service'],
      required: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'listingType',
    },
  },
  { timestamps: true }
);

// Prevent duplicate favorites (same user favoriting the same listing twice)
favoriteSchema.index({ user: 1, listingType: 1, listing: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);