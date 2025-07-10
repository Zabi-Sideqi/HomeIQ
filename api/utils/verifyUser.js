//api/utils/verifyUser.js
// api/utils/verifyToken.js
import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';

export const verifyToken = (req, res, next) => {
  // Get token from cookie first (priority same as in Code 1)
  let token = req.cookies?.access_token;

  // If no cookie token is found, check the Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  // If no token found at all → 401 Unauthorized
  if (!token) return next(errorHandler(401, 'Unauthorized - No token provided'));

  // Verify the JWT
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err); // Log error for debugging
      return next(errorHandler(403, 'Forbidden - Invalid token'));
    }

    // Attach decoded user info to the request object
    req.user = user;
    next();
  });
};
