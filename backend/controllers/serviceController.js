const Service = require('../models/Service');
const cloudinary = require('../config/cloudinary');

// @desc    Create a new service listing
// @route   POST /api/services
const createService = async (req, res) => {
  try {
    const { title, description, category, price, deliveryTime, availability, city, country } = req.body;

    if (!title || !description || !category || !price || !deliveryTime) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const portfolioImages = (req.files || []).map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    const service = await Service.create({
      provider: req.user._id,
      title,
      description,
      category,
      price,
      deliveryTime,
      availability: availability || 'Available',
      portfolioImages,
      location: { city: city || '', country: country || '' },
    });

    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all services (search, filter, pagination)
// @route   GET /api/services
const getServices = async (req, res) => {
  try {
    const { keyword, category, minPrice, maxPrice, city, availability, page = 1, limit = 12, sort } = req.query;

    const query = { isActive: true, isApproved: true };

    if (keyword) {
      query.$text = { $search: keyword };
    }
    if (category) {
      query.category = category;
    }
    if (city) {
      query['location.city'] = city;
    }
    if (availability) {
      query.availability = availability;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { averageRating: -1 };

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [services, total] = await Promise.all([
      Service.find(query)
        .populate('provider', 'fullName profilePicture averageRating')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Service.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: services,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single service by ID
// @route   GET /api/services/:id
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate(
      'provider',
      'fullName profilePicture averageRating totalReviews location bio skills'
    );

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    service.views += 1;
    await service.save();

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this service' });
    }

    const { title, description, category, price, deliveryTime, availability, city, country } = req.body;

    if (title) service.title = title;
    if (description) service.description = description;
    if (category) service.category = category;
    if (price) service.price = price;
    if (deliveryTime) service.deliveryTime = deliveryTime;
    if (availability) service.availability = availability;
    if (city) service.location.city = city;
    if (country) service.location.country = country;

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
      service.portfolioImages.push(...newImages);
    }

    await service.save();

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (service.provider.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this service' });
    }

    for (const image of service.portfolioImages) {
      await cloudinary.uploader.destroy(image.publicId).catch(() => {});
    }

    await service.deleteOne();

    res.status(200).json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged-in user's own services
// @route   GET /api/services/my-listings
const getMyServices = async (req, res) => {
  try {
    const services = await Service.find({ provider: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  getMyServices,
};