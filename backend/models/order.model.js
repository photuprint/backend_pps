const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      price: Number,
    },
  ],
  amount: Number,
  paymentStatus: { type: String, default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
