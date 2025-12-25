import express from 'express';
import { 
  createCountry, 
  getCountries, 
  getCountryById, 
  updateCountry, 
  deleteCountry, 
  hardDeleteCountry 
} from '../controllers/country.controller.js';

const router = express.Router();

// Public routes
router.get('/', getCountries);
router.get('/:id', getCountryById);

// Protected routes (require authentication)
router.post('/', createCountry);
router.put('/:id', updateCountry);
router.delete('/:id', deleteCountry);
router.delete('/:id/hard', hardDeleteCountry);

export default router;
