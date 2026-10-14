const express = require('express');
const router = express.Router();
const db = require('../middleware/db');
const apiKey = require('../middleware/apikey');

// Tất cả route ở đây cần API Key
router.use(apiKey);

// GET /apikey/products
router.get('/products', (req, res) => {
  const products = db.get('products').value();
  res.json({ auth: 'api-key', total: products.length, data: products });
});

// GET /apikey/orders
router.get('/orders', (req, res) => {
  const orders = db.get('orders').value();
  res.json({ auth: 'api-key', total: orders.length, data: orders });
});

module.exports = router;
