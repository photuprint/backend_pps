import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, unique: true },
  description: { type: String, default: null },
  image: { type: String, default: null },
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true 
});

// Create index for better search performance
categorySchema.index({ name: 1, slug: 1 });

export default mongoose.model('Category', categorySchema);
