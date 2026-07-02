const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

// @desc    Create a new product listing
// @route   POST /api/products
const createProduct = async (req, res) => {
  try {
    const { title, description, price, category, stock, city, country } = req.body;

    if (!title || !description || !price || !category) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const images = (req.files || []).map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    const product = await Product.create({
      seller: req.user._id,
      title,
      description,
      price,
      category,
      stock: stock || 1,
      images,
      location: { city: city || '', country: country || '' },
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all products (search, filter, pagination)
// @route   GET /api/products
const getProducts = async (req, res) => {
  try {
    const { keyword, category, minPrice, maxPrice, city, page = 1, limit = 12, sort } = req.query;

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
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 }; // default: latest first
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('seller', 'fullName profilePicture averageRating')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: products,
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

// @desc    Get single product by ID
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'seller',
      'fullName profilePicture averageRating totalReviews location'
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.views += 1;
    await product.save();

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this product' });
    }

    const { title, description, price, category, stock, city, country } = req.body;

    if (title) product.title = title;
    if (description) product.description = description;
    if (price) product.price = price;
    if (category) product.category = category;
    if (stock !== undefined) product.stock = stock;
    if (city) product.location.city = city;
    if (country) product.location.country = country;

    // If new images were uploaded, add them to the existing array
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
      product.images.push(...newImages);
    }

    await product.save();

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
    }

    // Remove images from Cloudinary
    for (const image of product.images) {
      await cloudinary.uploader.destroy(image.publicId).catch(() => {});
    }

    await product.deleteOne();

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged-in user's own products
// @route   GET /api/products/my-listings
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
};