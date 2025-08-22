import Review from '../models/review.model.js';

// Get all reviews
export const getReviews = async (req, res) => {
  try {
    const { 
      categoryId, 
      subCategoryId, 
      productId, 
      status, 
      rating, 
      search,
      page = 1,
      limit = 20
    } = req.query;
    
    let query = { isActive: true };
    
    if (categoryId) query.categoryId = categoryId;
    if (subCategoryId) query.subCategoryId = subCategoryId;
    if (productId) query.productId = productId;
    if (status) query.status = status;
    if (rating) query.rating = parseInt(rating);
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find(query)
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name')
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments(query);
    
    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ msg: 'Failed to fetch reviews' });
  }
};

// Get single review by ID
export const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name')
      .populate('productId', 'name');
      
    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }
    res.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ msg: 'Failed to fetch review' });
  }
};

// Create new review
export const createReview = async (req, res) => {
  try {
    const {
      categoryId,
      subCategoryId,
      productId,
      productName,
      userId,
      name,
      title,
      email,
      comment,
      rating
    } = req.body;
    
    // Check if all required fields are present
    if (!categoryId || !subCategoryId || !productId || !userId || !name || !email || !comment || !rating) {
      return res.status(400).json({ msg: 'All required fields must be provided' });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    // Handle image uploads if present
    let avatar = null;
    let productImage = null;
    
    if (req.files) {
      if (req.files.avatar) {
        avatar = req.files.avatar[0].path;
      }
      if (req.files.productImage) {
        productImage = req.files.productImage[0].path;
      }
    }

    const review = new Review({
      categoryId,
      subCategoryId,
      productId,
      productName,
      userId,
      name,
      avatar,
      title,
      email,
      comment,
      rating,
      productImage
    });

    const savedReview = await review.save();
    
    // Populate references before sending response
    const populatedReview = await Review.findById(savedReview._id)
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name')
      .populate('productId', 'name');
    
    res.status(201).json(populatedReview);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ msg: 'Failed to create review' });
  }
};

// Update review
export const updateReview = async (req, res) => {
  try {
    const {
      categoryId,
      subCategoryId,
      productId,
      productName,
      userId,
      name,
      title,
      email,
      comment,
      rating,
      status
    } = req.body;
    
    // Check if review exists
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }

    // Handle image uploads if present
    if (req.files) {
      if (req.files.avatar) {
        review.avatar = req.files.avatar[0].path;
      }
      if (req.files.productImage) {
        review.productImage = req.files.productImage[0].path;
      }
    }

    // Update fields
    if (categoryId) review.categoryId = categoryId;
    if (subCategoryId) review.subCategoryId = subCategoryId;
    if (productId) review.productId = productId;
    if (productName !== undefined) review.productName = productName;
    if (userId) review.userId = userId;
    if (name) review.name = name;
    if (title !== undefined) review.title = title;
    if (email) review.email = email;
    if (comment) review.comment = comment;
    if (rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
      }
      review.rating = rating;
    }
    if (status) review.status = status;

    const updatedReview = await review.save();
    
    // Populate references before sending response
    const populatedReview = await Review.findById(updatedReview._id)
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name')
      .populate('productId', 'name');
    
    res.json(populatedReview);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ msg: 'Failed to update review' });
  }
};

// Update review status
export const updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status. Must be pending, approved, or rejected' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }

    review.status = status;
    const updatedReview = await review.save();
    
    res.json({ msg: 'Review status updated successfully', status: updatedReview.status });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({ msg: 'Failed to update review status' });
  }
};

// Delete review (soft delete)
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }

    review.isActive = false;
    await review.save();
    
    res.json({ msg: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ msg: 'Failed to delete review' });
  }
};

// Hard delete review
export const hardDeleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }
    
    res.json({ msg: 'Review permanently deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ msg: 'Failed to delete review' });
  }
}; 