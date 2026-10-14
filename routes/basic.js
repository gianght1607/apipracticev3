const express = require('express');
const router = express.Router();
const db = require('../middleware/db');
const basicAuth = require('../middleware/basicAuth');

// Tất cả route ở đây cần Basic Auth
router.use(basicAuth);

// GET /basic/me
router.get('/me', (req, res) => {
  const user = db.get('users').find({ id: req.user.id }).value();
  const { password, ...rest } = user;
  res.json({ auth: 'basic', user: rest });
});

// GET /basic/users
router.get('/users', (req, res) => {
  const users = db.get('users').map(({ password, ...rest }) => rest).value();
  res.json({ auth: 'basic', total: users.length, data: users });
});

module.exports = router;
