const express = require('express');
const router = express.Router();
const {
  getStats,
  getAllUsers,
  toggleSuspendUser,
  getAllListings,
  toggleListingApproval,
  removeListing,
  getReportedReviews,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All admin routes require both authentication AND admin role
router.use(protect, admin);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.put('/users/:id/suspend', toggleSuspendUser);
router.get('/listings', getAllListings);
router.put('/listings/:type/:id/approve', toggleListingApproval);
router.delete('/listings/:type/:id', removeListing);
router.get('/reported-reviews', getReportedReviews);

module.exports = router;