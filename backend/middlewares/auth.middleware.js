const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
  next();
};
