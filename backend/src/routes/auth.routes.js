import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register new user (business owner)
 * Public
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('businessName').notEmpty().withMessage('Business name is required'),
    body('contactEmail').isEmail().normalizeEmail().withMessage('Valid contact email is required'),
    validate,
  ],
  asyncHandler(authController.register)
);

/**
 * POST /api/auth/login
 * Login user
 * Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  asyncHandler(authController.login)
);

/**
 * GET /api/auth/me
 * Get current user profile
 * Private
 */
router.get('/me', authenticate, asyncHandler(authController.getProfile));

/**
 * PUT /api/auth/profile
 * pdate user profile
 * Private
 */
router.put(
  '/profile',
  authenticate,
  [
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    validate,
  ],
  asyncHandler(authController.updateProfile)
);

/**
 * PUT /api/auth/password
 * Change password
 * Private
 */
router.put(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    validate,
  ],
  asyncHandler(authController.changePassword)
);

export default router;


// checked all api