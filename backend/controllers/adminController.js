const User = require('../models/User');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// @desc    Get platform statistics
// @route   GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalServices, totalBookings, completedBookings, totalReviews, reportedReviews] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Service.countDocuments(),
        Booking.countDocuments(),
        Booking.countDocuments({ status: 'completed' }),
        Review.countDocuments(),
        Review.countDocuments({ isReported: true }),
      ]);

    const revenueResult = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalServices,
        totalListings: totalProducts + totalServices,
        totalBookings,
        completedBookings,
        totalReviews,
        reportedReviews,
        totalRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (with pagination)
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Suspend or unsuspend a user
// @route   PUT /api/admin/users/:id/suspend
const toggleSuspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot suspend an admin account' });
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'} successfully`,
      data: { _id: user._id, isSuspended: user.isSuspended },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all listings (products + services) for moderation
// @route   GET /api/admin/listings
const getAllListings = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    if (type === 'product') {
      const [products, total] = await Promise.all([
        Product.find().populate('seller', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        Product.countDocuments(),
      ]);
      return res.status(200).json({
        success: true,
        data: products,
        pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) },
      });
    }

    if (type === 'service') {
      const [services, total] = await Promise.all([
        Service.find().populate('provider', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        Service.countDocuments(),
      ]);
      return res.status(200).json({
        success: true,
        data: services,
        pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) },
      });
    }

    // If no type specified, return both combined (simple approach)
    const [products, services] = await Promise.all([
      Product.find().populate('seller', 'fullName email').sort({ createdAt: -1 }).limit(limitNum),
      Service.find().populate('provider', 'fullName email').sort({ createdAt: -1 }).limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      data: { products, services },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve or remove a listing
// @route   PUT /api/admin/listings/:type/:id/approve
const toggleListingApproval = async (req, res) => {
  try {
    const { type, id } = req.params;

    if (!['product', 'service'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be product or service' });
    }

    const Model = type === 'product' ? Product : Service;
    const listing = await Model.findById(id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    listing.isApproved = !listing.isApproved;
    await listing.save();

    res.status(200).json({
      success: true,
      message: `Listing ${listing.isApproved ? 'approved' : 'unapproved'} successfully`,
      data: { _id: listing._id, isApproved: listing.isApproved },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove (deactivate) a listing
// @route   DELETE /api/admin/listings/:type/:id
const removeListing = async (req, res) => {
  try {
    const { type, id } = req.params;

    if (!['product', 'service'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be product or service' });
    }

    const Model = type === 'product' ? Product : Service;
    const listing = await Model.findById(id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    listing.isActive = false;
    await listing.save();

    res.status(200).json({ success: true, message: 'Listing removed from public view' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reported reviews
// @route   GET /api/admin/reported-reviews
const getReportedReviews = async (req, res) => {
  try {
    const Review = require('../models/Review');
    const reviews = await Review.find({ isReported: true })
      .populate('reviewer', 'fullName email')
      .populate('reviewedUser', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStats,
  getAllUsers,
  toggleSuspendUser,
  getAllListings,
  toggleListingApproval,
  removeListing,
  getReportedReviews,
};