const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../middleware/db');

const SECRET = process.env.JWT_SECRET || 'practice-api-secret-2024';

// POST /auth/login — Body: raw JSON
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username) return res.status(400).json({ error: 'Bad Request', message: 'username is required' });
  if (!password) return res.status(400).json({ error: 'Bad Request', message: 'password is required' });

  const user = db.get('users').find({ username }).value();
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid username or password' });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET,
    { expiresIn: '2h' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// POST /auth/register — Body: x-www-form-urlencoded
router.post('/register', (req, res) => {
  const { username, password, name, email } = req.body;

  if (!username) return res.status(400).json({ error: 'Bad Request', message: 'username is required' });
  if (!password) return res.status(400).json({ error: 'Bad Request', message: 'password is required' });
  if (!name)     return res.status(400).json({ error: 'Bad Request', message: 'name is required' });
  if (!email)    return res.status(400).json({ error: 'Bad Request', message: 'email is required' });

  if (typeof username !== 'string') return res.status(400).json({ error: 'Bad Request', message: 'username must be a string' });
  if (password.length < 6) return res.status(400).json({ error: 'Bad Request', message: 'password must be at least 6 characters' });

  const existing = db.get('users').find({ username }).value();
  if (existing) {
    return res.status(409).json({ error: 'Conflict', message: 'Username already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: uuidv4(),
    username,
    password: hashedPassword,
    name,
    email,
    role: 'user',
    createdAt: new Date().toISOString()
  };

  db.get('users').push(newUser).write();

  res.status(201).json({
    message: 'Register successful',
    user: { id: newUser.id, username, name, email, role: newUser.role }
  });
});

module.exports = router;
