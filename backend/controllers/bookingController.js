const Booking = require('../models/Booking');
const Product = require('../models/Product');
const Service = require('../models/Service');
const createNotification = require('../utils/createNotification');

// @desc    Create a booking request
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const { listingType, listingId, quantity, preferredDate, preferredTime, notes } = req.body;

    if (!listingType || !listingId) {
      return res.status(400).json({ success: false, message: 'Listing type and listing ID are required' });
    }

    if (!['Product', 'Service'].includes(listingType)) {
      return res.status(400).json({ success: false, message: 'listingType must be Product or Service' });
    }

    const Model = listingType === 'Product' ? Product : Service;
    const listing = await Model.findById(listingId);

    if (!listing) {
      return res.status(404).json({ success: false, message: `${listingType} not found` });
    }

    const sellerId = listingType === 'Product' ? listing.seller : listing.provider;

    if (sellerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot book your own listing' });
    }

    const qty = quantity || 1;
    const totalPrice = listing.price * qty;

    const booking = await Booking.create({
      buyer: req.user._id,
      seller: sellerId,
      listingType,
      listing: listingId,
      quantity: qty,
      totalPrice,
      preferredDate,
      preferredTime,
      notes,
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('buyer', 'fullName profilePicture')
      .populate('seller', 'fullName profilePicture')
      .populate('listing');

    await createNotification({
      recipient: sellerId,
      type: 'booking_request',
      title: 'New Booking Request',
      message: `${req.user.fullName} sent you a booking request for "${listing.title}"`,
      relatedId: booking._id,
    });

    res.status(201).json({ success: true, data: populatedBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings where user is the buyer
// @route   GET /api/bookings/my-bookings
const getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { buyer: req.user._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('seller', 'fullName profilePicture')
      .populate('listing')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings where user is the seller/provider (requests received)
// @route   GET /api/bookings/received
const getReceivedBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { seller: req.user._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('buyer', 'fullName profilePicture')
      .populate('listing')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('buyer', 'fullName profilePicture')
      .populate('seller', 'fullName profilePicture')
      .populate('listing');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isParticipant =
      booking.buyer._id.toString() === req.user._id.toString() ||
      booking.seller._id.toString() === req.user._id.toString();

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept a booking (seller/provider only)
// @route   PUT /api/bookings/:id/accept
const acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot accept a booking with status "${booking.status}"` });
    }

    booking.status = 'accepted';
    await booking.save();

    await createNotification({
      recipient: booking.buyer,
      type: 'booking_accepted',
      title: 'Booking Accepted',
      message: `Your booking request has been accepted`,
      relatedId: booking._id,
    });

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject a booking (seller/provider only)
// @route   PUT /api/bookings/:id/reject
const rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot reject a booking with status "${booking.status}"` });
    }

    booking.status = 'rejected';
    booking.cancellationReason = req.body.reason || '';
    await booking.save();

    await createNotification({
      recipient: booking.buyer,
      type: 'booking_rejected',
      title: 'Booking Rejected',
      message: `Your booking request was declined`,
      relatedId: booking._id,
    });

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a booking as completed (seller/provider only)
// @route   PUT /api/bookings/:id/complete
const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Only accepted bookings can be marked completed' });
    }

    booking.status = 'completed';
    await booking.save();

    await createNotification({
      recipient: booking.buyer,
      type: 'booking_completed',
      title: 'Booking Completed',
      message: `Your booking has been marked as completed. Don't forget to leave a review!`,
      relatedId: booking._id,
    });

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a booking (buyer or seller)
// @route   PUT /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isParticipant =
      booking.buyer.toString() === req.user._id.toString() ||
      booking.seller.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (['completed', 'cancelled', 'rejected'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a booking with status "${booking.status}"` });
    }

    booking.status = 'cancelled';
    booking.cancelledBy = req.user._id;
    booking.cancellationReason = req.body.reason || '';
    await booking.save();

    const notifyRecipient =
      booking.buyer.toString() === req.user._id.toString() ? booking.seller : booking.buyer;

    await createNotification({
      recipient: notifyRecipient,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `A booking was cancelled`,
      relatedId: booking._id,
    });

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getReceivedBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  completeBooking,
  cancelBooking,
};