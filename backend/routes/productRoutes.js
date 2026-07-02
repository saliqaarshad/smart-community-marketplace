const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getProducts);

// Protected routes (must come before /:id to avoid route conflicts)
router.get('/my-listings', protect, getMyProducts);

router.post('/', protect, upload.array('images', 5), createProduct);
router.put('/:id', protect, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, deleteProduct);

// Public route (must come after /my-listings)
router.get('/:id', getProductById);

module.exports = router;