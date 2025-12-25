import express from 'express';
import { 
  createFitType, 
  getFitTypes, 
  getFitTypeById, 
  updateFitType, 
  deleteFitType, 
  hardDeleteFitType 
} from '../controllers/fitType.controller.js';

const router = express.Router();

// Public routes
router.get('/', getFitTypes);
router.get('/:id', getFitTypeById);

// Protected routes (require authentication)
router.post('/', createFitType);
router.put('/:id', updateFitType);
router.delete('/:id', deleteFitType);
router.delete('/:id/hard', hardDeleteFitType);

export default router;
