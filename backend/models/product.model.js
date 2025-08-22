import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: String,
  price: { type: Number, required: true },
  sku: { type: String, unique: true },
  images: [String],
  colors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Color' }],
  sizes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Size' }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
  stock: Number,
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
