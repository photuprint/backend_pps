import mongoose from 'mongoose';

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  image: String,
  isActive: { type: Boolean, default: true },
  deleted: { type: Boolean, default: false }
}, { 
  timestamps: true 
});

// Create index for better search performance
colorSchema.index({ name: 1, code: 1 });

export default mongoose.model('Color', colorSchema);
