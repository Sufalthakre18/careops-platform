import express from 'express';
import { body, param } from 'express-validator';
import { authenticate, requireOwner } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as staffController from '../controllers/staff.controller.js';

const router = express.Router();

/**
 * POST /api/staff/invite
 * Invite staff member
 * Private (Owner only)
 */
router.post(
  '/invite',
  authenticate,
  requireOwner,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('permissions').optional().isObject(),
    validate,
  ],
  asyncHandler(staffController.inviteStaff)
);

/**
 * GET /api/staff
 * Get all staff members
 * Private (Owner only)
 */
router.get(
  '/',
  authenticate,
  requireOwner,
  asyncHandler(staffController.getStaff)
);

/**
 * GET /api/staff/:id
 * Get staff member by ID
 * Private (Owner only)
 */
router.get(
  '/:id',
  authenticate,
  requireOwner,
  [param('id').isUUID(), validate],
  asyncHandler(staffController.getStaffById)
);

/**
 * PUT /api/staff/:id
 * Update staff member info
 * Private (Owner only)
 */
router.put(
  '/:id',
  authenticate,
  requireOwner,
  [
    param('id').isUUID(),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'PENDING']),
    validate,
  ],
  asyncHandler(staffController.updateStaff)
);

/**
 * PUT /api/staff/:id/permissions
 * Update staff permissions
 * Private (Owner only)
 */
router.put(
  '/:id/permissions',
  authenticate,
  requireOwner,
  [
    param('id').isUUID(),
    body('canAccessInbox').optional().isBoolean(),
    body('canManageBookings').optional().isBoolean(),
    body('canViewForms').optional().isBoolean(),
    body('canManageForms').optional().isBoolean(),
    body('canViewInventory').optional().isBoolean(),
    body('canManageInventory').optional().isBoolean(),
    body('canManageContacts').optional().isBoolean(),
    validate,
  ],
  asyncHandler(staffController.updatePermissions)
);

/**
 * PUT /api/staff/:id/activate
 * Activate staff member
 * Private (Owner only)
 */
router.put(
  '/:id/activate',
  authenticate,
  requireOwner,
  [param('id').isUUID(), validate],
  asyncHandler(staffController.activateStaff)
);

/**
 * PUT /api/staff/:id/deactivate
 * Deactivate staff member
 * Private (Owner only)
 */
router.put(
  '/:id/deactivate',
  authenticate,
  requireOwner,
  [param('id').isUUID(), validate],
  asyncHandler(staffController.deactivateStaff)
);

/**
 * DELETE /api/staff/:id
 * Remove staff member
 * Private (Owner only)
 */
router.delete(
  '/:id',
  authenticate,
  requireOwner,
  [param('id').isUUID(), validate],
  asyncHandler(staffController.removeStaff)
);

/**
 * POST /api/staff/:id/reset-password
 * Reset staff password
 * Private (Owner only)
 */
router.post(
  '/:id/reset-password',
  authenticate,
  requireOwner,
  [param('id').isUUID(), validate],
  asyncHandler(staffController.resetPassword)
);

export default router;