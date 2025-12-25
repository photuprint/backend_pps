import express from 'express';
import { 
  getMaterials, 
  getMaterialById, 
  createMaterial, 
  updateMaterial, 
  deleteMaterial, 
  hardDeleteMaterial 
} from '../controllers/material.controller.js';
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getMaterials);
router.get('/:id', getMaterialById);

// Protected routes (require authentication)
router.post('/', upload.single('image'), createMaterial);
router.put('/:id', upload.single('image'), updateMaterial);
router.delete('/:id', deleteMaterial);
router.delete('/:id/hard', hardDeleteMaterial);

export default router; 