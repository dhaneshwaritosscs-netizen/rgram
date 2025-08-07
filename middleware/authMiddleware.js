/**
 * Authentication Middleware
 * JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Verify JWT token and attach user to request
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      // Update last active timestamp
      user.lastActive = new Date();
      await user.save();

      // Attach user to request
      req.user = user;
      next();

    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

/**
 * Optional authentication - Verify JWT token if present but don't require it
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (user && user.isActive) {
        user.lastActive = new Date();
        await user.save();
        req.user = user;
      }
    } catch (error) {
      // Token is invalid, but we don't fail the request
      console.log('Optional auth failed:', error.message);
    }
  }

  next();
};

/**
 * Admin authorization - Check if user is admin
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

/**
 * Moderator authorization - Check if user is moderator or admin
 */
const moderator = (req, res, next) => {
  if (req.user && (req.user.role === 'moderator' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Moderator privileges required.'
    });
  }
};

/**
 * Owner authorization - Check if user owns the resource or is admin
 */
const owner = (resourceUserId) => {
  return (req, res, next) => {
    const targetUserId = req.params[resourceUserId] || req.body[resourceUserId];
    
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Resource user ID is required'
      });
    }

    if (req.user.role === 'admin' || req.user._id.toString() === targetUserId.toString()) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own resources.'
      });
    }
  };
};

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * Verify JWT token without attaching user to request
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  protect,
  optionalAuth,
  admin,
  moderator,
  owner,
  generateToken,
  verifyToken
};
