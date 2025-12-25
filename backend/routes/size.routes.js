import express from 'express';
import { 
  createSize, 
  getSizes, 
  getSizeById, 
  updateSize, 
  deleteSize, 
  hardDeleteSize 
} from '../controllers/size.controller.js';
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getSizes);
router.get('/:id', getSizeById);

// Protected routes (require authentication)
router.post('/', upload.single('image'), createSize);
router.put('/:id', upload.single('image'), updateSize);
router.delete('/:id', deleteSize);
router.delete('/:id/hard', hardDeleteSize);

export default router;
