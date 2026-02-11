import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { ApiError } from './errorHandler.js';

// Verify JWT token and attach user to request

export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        workspace: true,
        permissions: true,
      },
    });

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new ApiError(401, 'User account is not active');
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    req.workspaceId = user.workspaceId;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Token expired'));
    } else {
      next(new ApiError(401, 'Authentication failed'));
    }
  }
};

// Check if user is workspace owner

export const requireOwner = (req, res, next) => {
  if (req.user.role !== 'OWNER') {
    throw new ApiError(403, 'Access denied. Owner role required.');
  }
  next();
};

// Check if user has specific permission

export const requirePermission = (permission) => {
  return (req, res, next) => {
    // Owners have all permissions
    if (req.user.role === 'OWNER') {
      return next();
    }

    // Check staff permissions
    if (!req.user.permissions || !req.user.permissions[permission]) {
      throw new ApiError(403, `Access denied. Permission required: ${permission}`);
    }

    next();
  };
};

// Optional authentication - doesn't throw error if no token

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          workspace: true,
          permissions: true,
        },
      });

      if (user && user.status === 'ACTIVE') {
        req.user = user;
        req.userId = user.id;
        req.workspaceId = user.workspaceId;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
};