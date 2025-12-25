import mongoose from 'mongoose';

const collarStyleSchema = new mongoose.Schema({
  collarStyleId: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  slug: { 
    type: String, 
    unique: true,
    required: true
  },
  description: { 
    type: String, 
    default: null,
    trim: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  deleted: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Create index for better search performance
collarStyleSchema.index({ name: 1, slug: 1, isActive: 1, deleted: 1 });
collarStyleSchema.index({ collarStyleId: 1 });

// Pre-save middleware to generate slug
collarStyleSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  }
  next();
});

export default mongoose.model('CollarStyle', collarStyleSchema); 