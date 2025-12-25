import express from 'express';
import { 
  createCollarStyle, 
  getCollarStyles, 
  getCollarStyleById, 
  updateCollarStyle, 
  deleteCollarStyle, 
  hardDeleteCollarStyle,
  revertCollarStyle
} from '../controllers/collarStyle.controller.js';

const router = express.Router();

// Public routes
router.get('/', getCollarStyles);
router.get('/:id', getCollarStyleById);

// Protected routes (require authentication)
router.post('/', createCollarStyle);
router.put('/:id', updateCollarStyle);
router.delete('/:id', deleteCollarStyle);
router.delete('/:id/hard', hardDeleteCollarStyle);
router.put('/:id/revert', revertCollarStyle);

export default router; 