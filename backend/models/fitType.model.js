import mongoose from 'mongoose';

const fitTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  deleted: { type: Boolean, default: false } // Add deleted field for soft delete
}, { 
  timestamps: true 
});

// Create index for better search performance
fitTypeSchema.index({ name: 1 });

export default mongoose.model('FitType', fitTypeSchema);
