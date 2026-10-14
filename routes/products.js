const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const upload = multer(); // parse multipart/form-data (không lưu file, chỉ lấy field text)
const db = require('../middleware/db');
const auth = require('../middleware/auth');

// GET /products — public
router.get('/', (req, res) => {
  let products = db.get('products').value();

  // Search: ?name=laptop  hoặc  ?category=Electronics
  const { name, category, minPrice, maxPrice } = req.query;
  if (name)     products = products.filter(p => p.name.toLowerCase().includes(name.toLowerCase()));
  if (category) products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  if (minPrice) products = products.filter(p => p.price >= Number(minPrice));
  if (maxPrice) products = products.filter(p => p.price <= Number(maxPrice));

  res.json({ total: products.length, data: products });
});

// GET /products/:id — public
router.get('/:id', (req, res) => {
  const product = db.get('products').find({ id: req.params.id }).value();
  if (!product) return res.status(404).json({ error: 'Not Found', message: 'Product not found' });
  res.json(product);
});

// POST /products — cần token — Body: form-data
router.post('/', auth, upload.none(), (req, res) => {
  const { name, category, price, quantity, description } = req.body;

  if (!name)        return res.status(400).json({ error: 'Bad Request', message: 'name is required' });
  if (!category)    return res.status(400).json({ error: 'Bad Request', message: 'category is required' });
  if (price === undefined || price === null || price === '')
                    return res.status(400).json({ error: 'Bad Request', message: 'price is required' });
  if (quantity === undefined || quantity === null || quantity === '')
                    return res.status(400).json({ error: 'Bad Request', message: 'quantity is required' });

  if (isNaN(Number(price)))    return res.status(400).json({ error: 'Bad Request', message: 'price must be a number' });
  if (isNaN(Number(quantity))) return res.status(400).json({ error: 'Bad Request', message: 'quantity must be a number' });
  if (!Number.isInteger(Number(quantity))) return res.status(400).json({ error: 'Bad Request', message: 'quantity must be an integer' });
  if (Number(price) < 0)    return res.status(400).json({ error: 'Bad Request', message: 'price must be >= 0' });
  if (Number(quantity) < 0) return res.status(400).json({ error: 'Bad Request', message: 'quantity must be >= 0' });

  const newProduct = {
    id: uuidv4(),
    name,
    category,
    price: Number(price),
    quantity: Number(quantity),
    description: description || '',
    createdAt: new Date().toISOString()
  };

  db.get('products').push(newProduct).write();
  res.status(201).json({ message: 'Product created', data: newProduct });
});

// PUT /products/:id — cần token — Body: x-www-form-urlencoded
router.put('/:id', auth, (req, res) => {
  const product = db.get('products').find({ id: req.params.id }).value();
  if (!product) return res.status(404).json({ error: 'Not Found', message: 'Product not found' });

  const { name, category, price, quantity, description } = req.body;

  if (!name)        return res.status(400).json({ error: 'Bad Request', message: 'name is required' });
  if (!category)    return res.status(400).json({ error: 'Bad Request', message: 'category is required' });
  if (price === undefined || price === null || price === '')
                    return res.status(400).json({ error: 'Bad Request', message: 'price is required' });
  if (quantity === undefined || quantity === null || quantity === '')
                    return res.status(400).json({ error: 'Bad Request', message: 'quantity is required' });

  if (isNaN(Number(price)))    return res.status(400).json({ error: 'Bad Request', message: 'price must be a number' });
  if (isNaN(Number(quantity))) return res.status(400).json({ error: 'Bad Request', message: 'quantity must be a number' });
  if (!Number.isInteger(Number(quantity))) return res.status(400).json({ error: 'Bad Request', message: 'quantity must be an integer' });

  db.get('products').find({ id: req.params.id }).assign({
    name, category,
    price: Number(price),
    quantity: Number(quantity),
    description: description || product.description
  }).write();

  const updated = db.get('products').find({ id: req.params.id }).value();
  res.json({ message: 'Product updated', data: updated });
});

// DELETE /products/:id — cần token
router.delete('/:id', auth, (req, res) => {
  const product = db.get('products').find({ id: req.params.id }).value();
  if (!product) return res.status(404).json({ error: 'Not Found', message: 'Product not found' });

  db.get('products').remove({ id: req.params.id }).write();
  res.json({ message: 'Product deleted' });
});

module.exports = router;
