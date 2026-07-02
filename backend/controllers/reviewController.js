const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Product = require('../models/Product');
const Service = require('../models/Service');

// Helper: recalculate and update average rating for a User
const updateUserRating = async (userId) => {
  const reviews = await Review.find({ reviewedUser: userId });
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

  await User.findByIdAndUpdate(userId, {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
  });
};

// Helper: recalculate and update average rating for a listing (Product or Service)
const updateListingRating = async (listingType, listingId) => {
  const Model = listingType === 'Product' ? Product : Service;
  const reviews = await Review.find({ listingType, listing: listingId });
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

  // Product model doesn't have averageRating/totalReviews fields, only Service does
  if (listingType === 'Service') {
    await Model.findByIdAndUpdate(listingId, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
    });
  }
};

// @desc    Create a review for a completed booking
// @route   POST /api/reviews
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, message: 'Booking ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the buyer can leave a review for this booking' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'You can only review completed bookings' });
    }

    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'A review already exists for this booking' });
    }

    const review = await Review.create({
      booking: bookingId,
      reviewer: req.user._id,
      reviewedUser: booking.seller,
      listingType: booking.listingType,
      listing: booking.listing,
      rating,
      comment: comment || '',
    });

    // Update average ratings
    await updateUserRating(booking.seller);
    await updateListingRating(booking.listingType, booking.listing);

    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'fullName profilePicture')
      .populate('reviewedUser', 'fullName profilePicture');

    res.status(201).json({ success: true, data: populatedReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reviews for a specific user (seller reputation)
// @route   GET /api/reviews/user/:userId
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewedUser: req.params.userId })
      .populate('reviewer', 'fullName profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reviews for a specific listing
// @route   GET /api/reviews/listing/:listingType/:listingId
const getListingReviews = async (req, res) => {
  try {
    const { listingType, listingId } = req.params;

    if (!['Product', 'Service'].includes(listingType)) {
      return res.status(400).json({ success: false, message: 'listingType must be Product or Service' });
    }

    const reviews = await Review.find({ listingType, listing: listingId })
      .populate('reviewer', 'fullName profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Report a review as fake/inappropriate
// @route   PUT /api/reviews/:id/report
const reportReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.isReported = true;
    await review.save();

    res.status(200).json({ success: true, message: 'Review reported for moderation' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReview,
  getUserReviews,
  getListingReviews,
  reportReview,
};