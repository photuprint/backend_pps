import mongoose from 'mongoose';

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  hexCode: { type: String },
  image: String,
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true 
});

// Create index for better search performance
colorSchema.index({ name: 1, hexCode: 1 });

export default mongoose.model('Color', colorSchema);
