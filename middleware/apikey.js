const API_KEY = process.env.API_KEY || 'practice-api-key-123';

// API Key: header "x-api-key: <key>"  hoặc query "?api_key=<key>"
function apiKeyMiddleware(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!key) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing API key (header x-api-key or query api_key)' });
  }
  if (key !== API_KEY) {
    return res.status(403).json({ error: 'Forbidden', message: 'Invalid API key' });
  }
  next();
}

module.exports = apiKeyMiddleware;
