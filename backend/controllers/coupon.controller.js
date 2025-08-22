const Coupon = require('../models/coupon.model');

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

exports.getCoupons = async (req, res) => {
  const coupons = await Coupon.find();
  res.json(coupons);
};

exports.updateCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(coupon);
};

exports.deleteCoupon = async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ msg: 'Coupon deleted' });
};
