import express from 'express';
import { 
  createSize, 
  getSizes, 
  getSizeById, 
  updateSize, 
  deleteSize, 
  hardDeleteSize 
} from '../controllers/size.controller.js';

const router = express.Router();

// Public routes
router.get('/', getSizes);
router.get('/:id', getSizeById);

// Protected routes (require authentication)
router.post('/', createSize);
router.put('/:id', updateSize);
router.delete('/:id', deleteSize);
router.delete('/:id/hard', hardDeleteSize);

export default router;
