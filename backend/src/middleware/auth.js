const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Same check, but usable for WebSocket upgrade requests where there's no
// Express response object flow.
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
}

module.exports = { requireAuth, verifyToken };
