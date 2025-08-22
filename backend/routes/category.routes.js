import express from 'express';
import { 
  createCategory, 
  getCategories, 
  getCategoryById, 
  updateCategory, 
  deleteCategory, 
  hardDeleteCategory 
} from '../controllers/category.controller.js';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Protected routes (require authentication)
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.delete('/:id/hard', hardDeleteCategory);

export default router;
