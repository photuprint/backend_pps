import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category',
    required: true 
  },
  subCategoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subcategory',
    required: true 
  },
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true 
  },
  productName: { 
    type: String, 
    default: null 
  },
  userId: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  avatar: { 
    type: String, 
    default: null 
  },
  title: { 
    type: String, 
    default: null 
  },
  email: { 
    type: String, 
    required: true 
  },
  comment: { 
    type: String, 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  productImage: { 
    type: String, 
    default: null 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

// Create indexes for better search performance
reviewSchema.index({ productId: 1, status: 1 });
reviewSchema.index({ categoryId: 1, subCategoryId: 1 });
reviewSchema.index({ rating: 1, status: 1 });

export default mongoose.model('Review', reviewSchema); 