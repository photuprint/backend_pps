import express from 'express';
import { 
  getBrands, 
  getBrandById, 
  createBrand, 
  updateBrand, 
  deleteBrand, 
  hardDeleteBrand 
} from '../controllers/brand.controller.js';

const router = express.Router();

// Public routes
router.get('/', getBrands);
router.get('/:id', getBrandById);

// Protected routes (require authentication)
router.post('/', createBrand);
router.put('/:id', updateBrand);
router.delete('/:id', deleteBrand);
router.delete('/:id/hard', hardDeleteBrand);

export default router; 