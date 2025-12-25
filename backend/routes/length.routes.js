import express from 'express';
import { 
  createLength, 
  getLengths, 
  getLengthById, 
  updateLength, 
  deleteLength, 
  hardDeleteLength 
} from '../controllers/length.controller.js';
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getLengths);
router.get('/:id', getLengthById);

// Protected routes (require authentication)
router.post('/', upload.single('image'), createLength);
router.put('/:id', upload.single('image'), updateLength);
router.delete('/:id', deleteLength);
router.delete('/:id/hard', hardDeleteLength);

export default router;

