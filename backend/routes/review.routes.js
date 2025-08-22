import express from 'express';
import { 
  getReviews, 
  getReviewById, 
  createReview, 
  updateReview, 
  updateReviewStatus, 
  deleteReview, 
  hardDeleteReview 
} from '../controllers/review.controller.js';

const router = express.Router();

// Public routes
router.get('/', getReviews);
router.get('/:id', getReviewById);

// Protected routes (require authentication)
router.post('/', createReview);
router.put('/:id', updateReview);
router.patch('/:id/status', updateReviewStatus);
router.delete('/:id', deleteReview);
router.delete('/:id/hard', hardDeleteReview);

export default router; 