const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { graphql, buildSchema } = require('graphql');
const db = require('../middleware/db');

const SECRET = process.env.JWT_SECRET || 'practice-api-secret-2024';

const schema = buildSchema(`
  type Product {
    id: ID!
    name: String!
    category: String!
    price: Float!
    quantity: Int!
    description: String
  }

  type User {
    id: ID!
    username: String!
    name: String!
    email: String!
    role: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    products(name: String, category: String): [Product!]!
    product(id: ID!): Product
    users: [User!]!          # cần Bearer token
    me: User                 # cần Bearer token
  }

  type Mutation {
    login(username: String!, password: String!): AuthPayload!
    createProduct(name: String!, category: String!, price: Float!, quantity: Int!, description: String): Product!   # cần Bearer token
    updateProduct(id: ID!, name: String, category: String, price: Float, quantity: Int, description: String): Product!  # cần Bearer token
    deleteProduct(id: ID!): Boolean!   # cần Bearer token
  }
`);

function requireUser(ctx) {
  if (!ctx.user) throw new Error('Unauthorized: missing or invalid Bearer token');
  return ctx.user;
}

const publicUser = ({ password, ...rest }) => rest;

const rootValue = {
  // ---- Queries ----
  products: ({ name, category }) => {
    let list = db.get('products').value();
    if (name) list = list.filter(p => p.name.toLowerCase().includes(name.toLowerCase()));
    if (category) list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
    return list;
  },
  product: ({ id }) => db.get('products').find({ id }).value() || null,
  users: (_, ctx) => {
    requireUser(ctx);
    return db.get('users').value().map(publicUser);
  },
  me: (_, ctx) => {
    const u = requireUser(ctx);
    const user = db.get('users').find({ id: u.id }).value();
    return user ? publicUser(user) : null;
  },

  // ---- Mutations ----
  login: ({ username, password }) => {
    const user = db.get('users').find({ username }).value();
    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new Error('Invalid username or password');
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '2h' });
    return { token, user: publicUser(user) };
  },
  createProduct: ({ name, category, price, quantity, description }, ctx) => {
    requireUser(ctx);
    if (price < 0) throw new Error('price must be >= 0');
    if (quantity < 0) throw new Error('quantity must be >= 0');
    const p = { id: uuidv4(), name, category, price, quantity, description: description || '', createdAt: new Date().toISOString() };
    db.get('products').push(p).write();
    return p;
  },
  updateProduct: ({ id, ...fields }, ctx) => {
    requireUser(ctx);
    const found = db.get('products').find({ id }).value();
    if (!found) throw new Error('Product not found');
    const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined && v !== null));
    db.get('products').find({ id }).assign(patch).write();
    return db.get('products').find({ id }).value();
  },
  deleteProduct: ({ id }, ctx) => {
    requireUser(ctx);
    const found = db.get('products').find({ id }).value();
    if (!found) throw new Error('Product not found');
    db.get('products').remove({ id }).write();
    return true;
  }
};

function getUserFromHeader(req) {
  const h = req.headers['authorization'];
  if (!h) return null;
  const token = h.startsWith('Bearer ') ? h.slice(7) : h;
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

// POST /graphql — Body: raw JSON { "query": "...", "variables": {...}, "operationName": "..." }
router.post('/', async (req, res) => {
  const { query, variables, operationName } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ errors: [{ message: 'query is required (string)' }] });
  }
  const result = await graphql({
    schema,
    source: query,
    rootValue,
    contextValue: { user: getUserFromHeader(req) },
    variableValues: variables,
    operationName
  });
  // Chuẩn GraphQL: lỗi nằm trong body "errors", HTTP vẫn 200 (trừ lỗi cú pháp/validate -> 400)
  const status = result.data === undefined ? 400 : 200;
  res.status(status).json(result);
});

module.exports = router;
