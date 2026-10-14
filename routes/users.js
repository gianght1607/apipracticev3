const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const upload = multer(); // parse multipart/form-data (không lưu file, chỉ lấy field text)
const db = require('../middleware/db');
const auth = require('../middleware/auth');

// GET /users — cần token
router.get('/', auth, (req, res) => {
  const users = db.get('users').map(u => {
    const { password, ...rest } = u;
    return rest;
  }).value();
  res.json({ total: users.length, data: users });
});

// GET /users/:id — cần token
router.get('/:id', auth, (req, res) => {
  const user = db.get('users').find({ id: req.params.id }).value();
  if (!user) return res.status(404).json({ error: 'Not Found', message: 'User not found' });
  const { password, ...rest } = user;
  res.json(rest);
});

// POST /users — cần token — Body: form-data
router.post('/', auth, upload.none(), (req, res) => {
  const { username, password, name, email, role } = req.body;

  if (!username) return res.status(400).json({ error: 'Bad Request', message: 'username is required' });
  if (!password) return res.status(400).json({ error: 'Bad Request', message: 'password is required' });
  if (!name)     return res.status(400).json({ error: 'Bad Request', message: 'name is required' });
  if (!email)    return res.status(400).json({ error: 'Bad Request', message: 'email is required' });
  if (password.length < 6) return res.status(400).json({ error: 'Bad Request', message: 'password must be at least 6 characters' });

  const existing = db.get('users').find({ username }).value();
  if (existing) return res.status(409).json({ error: 'Conflict', message: 'Username already exists' });

  const newUser = {
    id: uuidv4(),
    username,
    password: bcrypt.hashSync(password, 10),
    name,
    email,
    role: role || 'user',
    createdAt: new Date().toISOString()
  };

  db.get('users').push(newUser).write();
  const { password: _, ...result } = newUser;
  res.status(201).json({ message: 'User created', data: result });
});

// PUT /users/:id — cần token
router.put('/:id', auth, (req, res) => {
  const user = db.get('users').find({ id: req.params.id }).value();
  if (!user) return res.status(404).json({ error: 'Not Found', message: 'User not found' });

  const { name, email, role } = req.body;
  if (!name)  return res.status(400).json({ error: 'Bad Request', message: 'name is required' });
  if (!email) return res.status(400).json({ error: 'Bad Request', message: 'email is required' });

  db.get('users').find({ id: req.params.id }).assign({ name, email, role: role || user.role }).write();
  const updated = db.get('users').find({ id: req.params.id }).value();
  const { password, ...result } = updated;
  res.json({ message: 'User updated', data: result });
});

// DELETE /users/:id — cần token
router.delete('/:id', auth, (req, res) => {
  const user = db.get('users').find({ id: req.params.id }).value();
  if (!user) return res.status(404).json({ error: 'Not Found', message: 'User not found' });

  db.get('users').remove({ id: req.params.id }).write();
  res.json({ message: 'User deleted' });
});

module.exports = router;
