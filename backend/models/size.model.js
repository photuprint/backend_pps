import mongoose from 'mongoose';

const sizeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  dimensions: String, // Optional, like "10x10"
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true 
});

// Create index for better search performance
sizeSchema.index({ name: 1, dimensions: 1 });

export default mongoose.model('Size', sizeSchema);
