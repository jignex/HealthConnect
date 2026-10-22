const jwt = require('jsonwebtoken');

// Verifies the JWT sent in the "Authorization: Bearer <token>" header
// and puts the decoded payload ({ id, role }) on req.user.
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({
      error: 'Access denied. Please log in first.'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid or expired token. Please log in again.'
      });
    }

    req.user = decoded; // { id, role, iat, exp }
    next();
  });
}

module.exports = authenticateToken;