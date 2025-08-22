import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Default route
app.get('/', (req, res) => {
  res.send('PhotuPrint API is running');
});

// Function to set up routes after database connection
export const setupRoutes = async () => {
  try {
    const authRoutes = (await import('./routes/auth.routes.js')).default;
    const userRoutes = (await import('./routes/user.routes.js')).default;
    const productRoutes = (await import('./routes/produt.route.js')).default;
    const categoryRoutes = (await import('./routes/category.routes.js')).default;
    const subcategoryRoutes = (await import('./routes/subcategory.routes.js')).default;
    const brandRoutes = (await import('./routes/brand.routes.js')).default;
    const materialRoutes = (await import('./routes/material.routes.js')).default;
    const productAttributeRoutes = (await import('./routes/productAttribute.routes.js')).default;
    const reviewRoutes = (await import('./routes/review.routes.js')).default;
    const colorRoutes = (await import('./routes/color.routes.js')).default;
    const sizeRoutes = (await import('./routes/size.routes.js')).default;
    
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/subcategories', subcategoryRoutes);
    app.use('/api/brands', brandRoutes);
    app.use('/api/materials', materialRoutes);
    app.use('/api/product-attributes', productAttributeRoutes);
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/colors', colorRoutes);
    app.use('/api/sizes', sizeRoutes);
    
    console.log('Routes set up successfully');
  } catch (error) {
    console.error('Error setting up routes:', error);
  }
};

export default app;
