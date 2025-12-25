import mongoose from 'mongoose';

const sizeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  initial: { type: String, default: null }, // Optional, like "S", "M", "L"
  dimensions: { type: String, default: null }, // Optional, like "10x10"
  description: { type: String, default: null },
  image: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  deleted: { type: Boolean, default: false } // Add deleted field for soft delete
}, { 
  timestamps: true 
});

// Create index for better search performance
sizeSchema.index({ name: 1, dimensions: 1 });

export default mongoose.model('Size', sizeSchema);
