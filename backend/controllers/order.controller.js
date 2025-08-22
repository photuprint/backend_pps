const Order = require('../models/order.model');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createOrder = async (req, res) => {
  const { token, products } = req.body;

  const amount = products.reduce((acc, p) => acc + p.price * p.quantity, 0);

  const charge = await stripe.charges.create({
    source: token,
    amount: Math.round(amount * 100),
    currency: 'usd',
  });

  const order = await Order.create({
    user: req.user._id,
    products,
    amount,
    paymentStatus: charge.status,
  });

  res.status(201).json(order);
};
