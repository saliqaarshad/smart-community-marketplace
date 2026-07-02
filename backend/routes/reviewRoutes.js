const express = require('express');
const router = express.Router();
const {
  createReview,
  getUserReviews,
  getListingReviews,
  reportReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/user/:userId', getUserReviews);
router.get('/listing/:listingType/:listingId', getListingReviews);

// Protected routes
router.post('/', protect, createReview);
router.put('/:id/report', protect, reportReview);

module.exports = router;