const bcrypt = require('bcryptjs');
const db = require('./db');

// Basic Auth: header "Authorization: Basic base64(username:password)"
function basicAuthMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  const challenge = { 'WWW-Authenticate': 'Basic realm="Practice API"' };

  if (!header || !header.startsWith('Basic ')) {
    return res.status(401).set(challenge).json({ error: 'Unauthorized', message: 'Missing or invalid Basic Authorization header' });
  }

  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const idx = decoded.indexOf(':');
  if (idx === -1) {
    return res.status(401).set(challenge).json({ error: 'Unauthorized', message: 'Malformed Basic credentials' });
  }
  const username = decoded.slice(0, idx);
  const password = decoded.slice(idx + 1);

  const user = db.get('users').find({ username }).value();
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).set(challenge).json({ error: 'Unauthorized', message: 'Invalid username or password' });
  }

  req.user = { id: user.id, username: user.username, role: user.role };
  next();
}

module.exports = basicAuthMiddleware;
