import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  brandId: { 
    type: String, 
    unique: true, 
    required: true 
  },
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  logo: { 
    type: String, 
    default: null 
  },
  gstNo: { 
    type: String, 
    default: null 
  },
  companyName: { 
    type: String, 
    default: null 
  },
  address: { 
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
  } // Add deleted field for soft delete
}, { 
  timestamps: true 
});

// Create index for better search performance
brandSchema.index({ name: 1, brandId: 1 });

export default mongoose.model('Brand', brandSchema); 