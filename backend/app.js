import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse FormData
app.use(morgan('dev'));

// Serve static files from uploads directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Default route
app.get('/', (req, res) => {
  res.send('PhotuPrint API is running');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
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
    const statusRoutes = (await import('./routes/status.routes.js')).default;
    const collarStyleRoutes = (await import('./routes/collarStyle.routes.js')).default;
    const fitTypeRoutes = (await import('./routes/fitType.routes.js')).default;
    const countryRoutes = (await import('./routes/country.routes.js')).default;
    const heightRoutes = (await import('./routes/height.routes.js')).default;
    const lengthRoutes = (await import('./routes/length.routes.js')).default;
    const patternRoutes = (await import('./routes/pattern.routes.js')).default;
    
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
    app.use('/api/status', statusRoutes);
    app.use('/api/collar-styles', collarStyleRoutes);
    app.use('/api/fit-types', fitTypeRoutes);
    app.use('/api/countries', countryRoutes);
    app.use('/api/heights', heightRoutes);
    app.use('/api/lengths', lengthRoutes);
    app.use('/api/patterns', patternRoutes);
    
    console.log('Routes set up successfully');
  } catch (error) {
    console.error('Error setting up routes:', error);
  }
};

export default app;
