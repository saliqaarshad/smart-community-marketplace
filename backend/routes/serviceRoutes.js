const express = require('express');
const router = express.Router();
const {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  getMyServices,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getServices);

// Protected routes (must come before /:id)
router.get('/my-listings', protect, getMyServices);

router.post('/', protect, upload.array('portfolioImages', 5), createService);
router.put('/:id', protect, upload.array('portfolioImages', 5), updateService);
router.delete('/:id', protect, deleteService);

// Public route (must come after /my-listings)
router.get('/:id', getServiceById);

module.exports = router;