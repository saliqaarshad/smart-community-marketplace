const express = require('express');
const router = express.Router();
const { addFavorite, removeFavorite, getMyFavorites } = require('../controllers/favoriteController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', addFavorite);
router.get('/', getMyFavorites);
router.delete('/:listingType/:listingId', removeFavorite);

module.exports = router;