const express = require('express');
const router = express.Router();
const db = require('../middleware/db');

// GET /search?q=laptop  → search across products + users
router.get('/', (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === '') {
    return res.status(400).json({ error: 'Bad Request', message: 'Query param "q" is required' });
  }

  const keyword = q.toLowerCase();

  const products = db.get('products').filter(p =>
    p.name.toLowerCase().includes(keyword) ||
    p.category.toLowerCase().includes(keyword) ||
    (p.description && p.description.toLowerCase().includes(keyword))
  ).value();

  const users = db.get('users').filter(u =>
    u.name.toLowerCase().includes(keyword) ||
    u.username.toLowerCase().includes(keyword) ||
    u.email.toLowerCase().includes(keyword)
  ).map(({ password, ...rest }) => rest).value();

  res.json({
    query: q,
    results: {
      products: { total: products.length, data: products },
      users:    { total: users.length,    data: users }
    }
  });
});

module.exports = router;
