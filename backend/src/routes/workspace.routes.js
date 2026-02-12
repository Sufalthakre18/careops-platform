import express from 'express';
import { body } from 'express-validator';
import { authenticate, requireOwner } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as workspaceController from '../controllers/workspace.controller.js';

const router = express.Router();

/**
 * GET /api/workspaces/current
 * Get current workspace
 * access  Private
 */
router.get('/current', authenticate, asyncHandler(workspaceController.getCurrentWorkspace));

/**
 * PUT /api/workspaces/current
 * Update workspace information
 * access  Private (Owner only)
 */
router.put(
  '/current',
  authenticate,
  requireOwner,
  [
    body('businessName').optional().notEmpty(),
    body('address').optional(),
    body('city').optional(),
    body('state').optional(),
    body('zipCode').optional(),
    body('country').optional(),
    body('timezone').optional(),
    body('contactEmail').optional().isEmail(),
    body('contactPhone').optional(),
    validate,
  ],
  asyncHandler(workspaceController.updateWorkspace)
);

/**
 * GET /api/workspaces/onboarding-status
 * Get onboarding status
 * access  Private
 */
router.get(
  '/onboarding-status',
  authenticate,
  asyncHandler(workspaceController.getOnboardingStatus)
);

/**
 * POST /api/workspaces/activate
 * Activate workspace (complete onboarding)
 * access  Private (Owner only)
 */
router.post(
  '/activate',
  authenticate,
  requireOwner,
  asyncHandler(workspaceController.activateWorkspace)
);

/**
 * GET /api/workspaces/stats
 * Get workspace statistics
 * access  Private
 */
router.get('/stats', authenticate, asyncHandler(workspaceController.getWorkspaceStats));

export default router;