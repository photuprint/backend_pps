import express from 'express';
import { 
  createHeight, 
  getHeights, 
  getHeightById, 
  updateHeight, 
  deleteHeight, 
  hardDeleteHeight 
} from '../controllers/height.controller.js';
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getHeights);
router.get('/:id', getHeightById);

// Protected routes (require authentication)
router.post('/', upload.single('image'), createHeight);
router.put('/:id', upload.single('image'), updateHeight);
router.delete('/:id', deleteHeight);
router.delete('/:id/hard', hardDeleteHeight);

export default router;

