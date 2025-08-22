import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { type: String, default: null },
  image: { type: String, default: null },
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true 
});

// Create index for better search performance
subcategorySchema.index({ name: 1, categoryId: 1, slug: 1 });

export default mongoose.model('Subcategory', subcategorySchema); 