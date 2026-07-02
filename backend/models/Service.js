const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Service title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Service description is required'],
      maxlength: 2000,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Graphic Designing',
        'Web Development',
        'Photography',
        'Home Services',
        'Tutoring',
        'Content Writing',
        'Digital Marketing',
        'Video Editing',
        'Other',
      ],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    deliveryTime: {
      type: String, // e.g. "3 days", "1 week"
      required: [true, 'Estimated delivery time is required'],
    },
    availability: {
      type: String,
      enum: ['Available', 'Busy', 'Unavailable'],
      default: 'Available',
    },
    portfolioImages: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    location: {
      city: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    favoritesCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Text index for keyword search
serviceSchema.index({ title: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Service', serviceSchema);