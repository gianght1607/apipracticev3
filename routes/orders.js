const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../middleware/db');
const auth = require('../middleware/auth');

// GET /orders — cần token
router.get('/', auth, (req, res) => {
  let orders = db.get('orders').value();

  // Filter: ?userId=u1  hoặc  ?status=pending
  const { userId, status } = req.query;
  if (userId) orders = orders.filter(o => o.userId === userId);
  if (status) orders = orders.filter(o => o.status === status);

  res.json({ total: orders.length, data: orders });
});

// GET /orders/:id — cần token
router.get('/:id', auth, (req, res) => {
  const order = db.get('orders').find({ id: req.params.id }).value();
  if (!order) return res.status(404).json({ error: 'Not Found', message: 'Order not found' });
  res.json(order);
});

// POST /orders — cần token
router.post('/', auth, (req, res) => {
  const { userId, items } = req.body;

  if (!userId) return res.status(400).json({ error: 'Bad Request', message: 'userId is required' });
  if (!items)  return res.status(400).json({ error: 'Bad Request', message: 'items is required' });
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Bad Request', message: 'items must be an array' });
  if (items.length === 0) return res.status(400).json({ error: 'Bad Request', message: 'items must not be empty' });

  for (const item of items) {
    if (!item.productId) return res.status(400).json({ error: 'Bad Request', message: 'items[].productId is required' });
    if (!item.quantity)  return res.status(400).json({ error: 'Bad Request', message: 'items[].quantity is required' });
    if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'items[].quantity must be a positive integer' });
    }
    const product = db.get('products').find({ id: item.productId }).value();
    if (!product) return res.status(404).json({ error: 'Not Found', message: `Product ${item.productId} not found` });
  }

  const user = db.get('users').find({ id: userId }).value();
  if (!user) return res.status(404).json({ error: 'Not Found', message: 'User not found' });

  // Build items with price snapshot
  const enrichedItems = items.map(item => {
    const product = db.get('products').find({ id: item.productId }).value();
    return {
      productId: item.productId,
      productName: product.name,
      quantity: Number(item.quantity),
      price: product.price
    };
  });

  const total = enrichedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const newOrder = {
    id: uuidv4(),
    userId,
    items: enrichedItems,
    total,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.get('orders').push(newOrder).write();
  res.status(201).json({ message: 'Order created', data: newOrder });
});

// PUT /orders/:id?status=... — cần token (chỉ update status) — truyền qua query param, không cần body
router.put('/:id', auth, (req, res) => {
  const order = db.get('orders').find({ id: req.params.id }).value();
  if (!order) return res.status(404).json({ error: 'Not Found', message: 'Order not found' });

  const { status } = req.query;
  if (!status) return res.status(400).json({ error: 'Bad Request', message: 'status is required (query param)' });

  const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Bad Request', message: `status must be one of: ${validStatuses.join(', ')}` });
  }

  db.get('orders').find({ id: req.params.id }).assign({ status }).write();
  const updated = db.get('orders').find({ id: req.params.id }).value();
  res.json({ message: 'Order updated', data: updated });
});

// DELETE /orders/:id — cần token
router.delete('/:id', auth, (req, res) => {
  const order = db.get('orders').find({ id: req.params.id }).value();
  if (!order) return res.status(404).json({ error: 'Not Found', message: 'Order not found' });

  db.get('orders').remove({ id: req.params.id }).write();
  res.json({ message: 'Order deleted' });
});

module.exports = router;
