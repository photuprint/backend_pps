const router = require('express').Router();
const { createOrder } = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, createOrder);

module.exports = router;
