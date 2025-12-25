import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  categoryId: { type: String, unique: true, sparse: true }, // Make it sparse and not required for existing records
  name: { type: String, required: true, unique: true },
  slug: { type: String, unique: true },
  description: { type: String, default: null },
  image: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  deleted: { type: Boolean, default: false } // Add deleted field for soft delete
}, { 
  timestamps: true 
});

// Create index for better search performance
categorySchema.index({ name: 1, slug: 1 });

export default mongoose.model('Category', categorySchema);
