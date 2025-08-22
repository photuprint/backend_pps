const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  expiryDate: { type: Date },
  usageLimit: { type: Number },
  usedCount: { type: Number, default: 0 },
  minPurchase: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
