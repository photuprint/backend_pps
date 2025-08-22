import Product from '../models/product.model.js';

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { keyword, category, minPrice, maxPrice } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments();
    
    let filter = {};

    if (keyword) {
      filter.name = { $regex: keyword, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice && maxPrice) {
      filter.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
    }

    const products = await Product.find(filter)
      .skip(skip)
      .limit(limit);
      
    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      products,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    
    res.json(product);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    
    res.json(product);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    
    res.json({ msg: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
