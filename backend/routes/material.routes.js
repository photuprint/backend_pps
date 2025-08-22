import express from 'express';
import { 
  getMaterials, 
  getMaterialById, 
  createMaterial, 
  updateMaterial, 
  deleteMaterial, 
  hardDeleteMaterial 
} from '../controllers/material.controller.js';

const router = express.Router();

// Public routes
router.get('/', getMaterials);
router.get('/:id', getMaterialById);

// Protected routes (require authentication)
router.post('/', createMaterial);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);
router.delete('/:id/hard', hardDeleteMaterial);

export default router; 