const Favorite = require('../models/Favorite');
const Product = require('../models/Product');
const Service = require('../models/Service');

// @desc    Add a listing to favorites
// @route   POST /api/favorites
const addFavorite = async (req, res) => {
  try {
    const { listingType, listingId } = req.body;

    if (!listingType || !listingId) {
      return res.status(400).json({ success: false, message: 'listingType and listingId are required' });
    }

    if (!['Product', 'Service'].includes(listingType)) {
      return res.status(400).json({ success: false, message: 'listingType must be Product or Service' });
    }

    const Model = listingType === 'Product' ? Product : Service;
    const listing = await Model.findById(listingId);

    if (!listing) {
      return res.status(404).json({ success: false, message: `${listingType} not found` });
    }

    const existing = await Favorite.findOne({
      user: req.user._id,
      listingType,
      listing: listingId,
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Already in favorites' });
    }

    const favorite = await Favorite.create({
      user: req.user._id,
      listingType,
      listing: listingId,
    });

    listing.favoritesCount += 1;
    await listing.save();

    res.status(201).json({ success: true, data: favorite });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a listing from favorites
// @route   DELETE /api/favorites/:listingType/:listingId
const removeFavorite = async (req, res) => {
  try {
    const { listingType, listingId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      user: req.user._id,
      listingType,
      listing: listingId,
    });

    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }

    const Model = listingType === 'Product' ? Product : Service;
    const listing = await Model.findById(listingId);
    if (listing && listing.favoritesCount > 0) {
      listing.favoritesCount -= 1;
      await listing.save();
    }

    res.status(200).json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged-in user's favorites
// @route   GET /api/favorites
const getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate('listing')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addFavorite, removeFavorite, getMyFavorites };