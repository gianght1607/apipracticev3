const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth',     require('./routes/auth'));
app.use('/users',    require('./routes/users'));
app.use('/products', require('./routes/products'));
app.use('/orders',   require('./routes/orders'));
app.use('/search',   require('./routes/search'));
app.use('/apikey',   require('./routes/apikey'));
app.use('/basic',    require('./routes/basic'));
app.use('/graphql',  require('./routes/graphql'));

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Practice API is running!',
    version: '1.0.0',
    endpoints: {
      auth:     ['POST /auth/login', 'POST /auth/register'],
      users:    ['GET /users', 'GET /users/:id', 'POST /users', 'PUT /users/:id', 'DELETE /users/:id'],
      products: ['GET /products', 'GET /products/:id', 'POST /products', 'PUT /products/:id', 'DELETE /products/:id'],
      orders:   ['GET /orders', 'GET /orders/:id', 'POST /orders', 'PUT /orders/:id', 'DELETE /orders/:id'],
      search:   ['GET /search?q=keyword'],
      apikey:   ['GET /apikey/products', 'GET /apikey/orders'],
      basic:    ['GET /basic/me', 'GET /basic/users'],
      graphql:  ['POST /graphql']
    },
    notes: {
      login_accounts: [
        { username: 'admin', password: 'password' },
        { username: 'tester', password: 'password' }
      ],
      auth_header: 'Authorization: Bearer <token>',
      api_key: 'x-api-key: practice-api-key-123 (hoặc ?api_key=...)',
      basic_auth: 'Authorization: Basic base64(username:password)'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Cannot ${req.method} ${req.path}` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Practice API running on port ${PORT}`);
  console.log(`Docs: http://localhost:${PORT}/`);
});
