import mongoose from 'mongoose';

const lengthSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: null },
  image: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  deleted: { type: Boolean, default: false } // Add deleted field for soft delete
}, { 
  timestamps: true 
});

// Create index for better search performance
lengthSchema.index({ name: 1 });

export default mongoose.model('Length', lengthSchema);

