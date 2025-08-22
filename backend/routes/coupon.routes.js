const router = require('express').Router();
const {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon
} = require('../controllers/coupon.controller');

const { protect, adminOnly } = require('../middleware/auth.middleware');

router.post('/', protect, adminOnly, createCoupon);
router.get('/', protect, adminOnly, getCoupons);
router.put('/:id', protect, adminOnly, updateCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);

module.exports = router;
