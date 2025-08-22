import express from 'express';
import { 
  createColor, 
  getColors, 
  getColorById, 
  updateColor, 
  deleteColor, 
  hardDeleteColor 
} from '../controllers/color.controller.js';

const router = express.Router();

// Public routes
router.get('/', getColors);
router.get('/:id', getColorById);

// Protected routes (require authentication)
router.post('/', createColor);
router.put('/:id', updateColor);
router.delete('/:id', deleteColor);
router.delete('/:id/hard', hardDeleteColor);

export default router;
