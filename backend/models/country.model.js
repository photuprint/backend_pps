import mongoose from 'mongoose';

const countrySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true, maxlength: 3 },
  description: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  deleted: { type: Boolean, default: false } // Add deleted field for soft delete
}, { 
  timestamps: true 
});

// Create index for better search performance
countrySchema.index({ name: 1, code: 1 });

export default mongoose.model('Country', countrySchema);
