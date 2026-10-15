import jwt from 'jsonwebtoken';

// Accepts only the httpOnly admin session cookie issued by /api/auth/login.
export const requireAdmin = (req, res, next) => {
  const token = req.cookies?.accessToken;
  const jwtSecret = process.env.JWT_SECRET;

  if (!token || !jwtSecret) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.admin = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Authentication required' });
  }
};
