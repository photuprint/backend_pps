import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema({
  subcategoryId: { type: String, unique: true, sparse: true }, // Auto-generated ID like SUBCATNM1001
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  categoryName: { type: String, required: true }, // Store category name directly
  categorySlug: { type: String, required: true }, // Store category slug for consistency
  description: { type: String, default: null },
  image: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  deleted: { type: Boolean, default: false }
}, { 
  timestamps: true 
});

// Create index for better search performance
subcategorySchema.index({ name: 1, categoryId: 1, slug: 1 });

export default mongoose.model('Subcategory', subcategorySchema); 