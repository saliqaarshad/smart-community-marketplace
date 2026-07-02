const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    stock: {
      type: Number,
      default: 1,
      min: 0,
    },
    location: {
      city: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    isApproved: {
      type: Boolean,
      default: true, // set to false if you want admin approval before listing goes live
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
  },
  { timestamps: true }
);

// Text index for keyword search
productSchema.index({ title: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);