import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  description: { 
    type: String, 
    default: null 
  },
  image: { 
    type: String, 
    default: null 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  deleted: { 
    type: Boolean, 
    default: false 
  }, // Add deleted field for soft delete
  properties: [{
    name: String,
    value: String
  }],
  category: { 
    type: String, 
    default: null 
  },
  type: {
    type: String,
    default: null
  }
}, { 
  timestamps: true 
});

// Create index for better search performance
materialSchema.index({ name: 1, category: 1 });

export default mongoose.model('Material', materialSchema); 