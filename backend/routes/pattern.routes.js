import express from 'express';
import { 
  createPattern, 
  getPatterns, 
  getPatternById, 
  updatePattern, 
  deletePattern, 
  hardDeletePattern 
} from '../controllers/pattern.controller.js';
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getPatterns);
router.get('/:id', getPatternById);

// Protected routes (require authentication)
router.post('/', upload.single('image'), createPattern);
router.put('/:id', upload.single('image'), updatePattern);
router.delete('/:id', deletePattern);
router.delete('/:id/hard', hardDeletePattern);

export default router;

