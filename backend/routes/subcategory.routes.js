import express from 'express';
import { 
  createSubCategory, 
  getSubCategories, 
  getSubCategoryById, 
  updateSubCategory, 
  deleteSubCategory, 
  hardDeleteSubCategory 
} from '../controllers/subcategory.controller.js';

const router = express.Router();

// Public routes
router.get('/', getSubCategories);
router.get('/:id', getSubCategoryById);

// Protected routes (require authentication)
router.post('/', createSubCategory);
router.put('/:id', updateSubCategory);
router.delete('/:id', deleteSubCategory);
router.delete('/:id/hard', hardDeleteSubCategory);

export default router;
