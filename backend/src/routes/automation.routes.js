import express from 'express';
import { body, param } from 'express-validator';
import { authenticate, requireOwner } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as automationController from '../controllers/automation.controller.js';

const router = express.Router();

/**
 * GET /api/automation
 * Get all automation rules
 * Private
 */
router.get(
  '/',
  authenticate,
  asyncHandler(automationController.getAutomationRules)
);

/**
 * GET /api/automation/:id
 * Get automation rule by ID
 * Private
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID(), validate],
  asyncHandler(automationController.getAutomationRuleById)
);

/**
 * POST /api/automation
 * Create automation rule
 * Private (Owner only)
 */
router.post(
  '/',
  authenticate,
  requireOwner,
  [
    body('name').notEmpty().withMessage('Rule name is required'),
    body('description').optional(),
    body('trigger')
      .isIn(['NEW_CONTACT', 'BOOKING_CREATED', 'BOOKING_REMINDER', 'FORM_PENDING', 'FORM_OVERDUE', 'INVENTORY_LOW'])
      .withMessage('Invalid trigger type'),
    body('action')
      .isIn(['SEND_EMAIL', 'SEND_SMS', 'CREATE_ALERT', 'UPDATE_STATUS'])
      .withMessage('Invalid action type'),
    body('config').isObject().withMessage('Config must be an object'),
    body('conditions').optional().isObject(),
    validate,
  ],
  asyncHandler(automationController.createAutomationRule)
);

/**
 * PUT /api/automation/:id
 * Update automation rule
 * Private (Owner only)
 */
router.put(
  '/:id',
  authenticate,
  requireOwner,
  [
    param('id').isUUID(),
    body('name').optional(),
    body('description').optional(),
    body('config').optional().isObject(),
    body('conditions').optional().isObject(),
    validate,
  ],
  asyncHandler(automationController.updateAutomationRule)
);

/**
 * PUT /api/automation/:id/toggle
 * Toggle automation rule active/inactive
 * Private (Owner only)
 */
router.put(
  '/:id/toggle',
  authenticate,
  requireOwner,
  [param('id').isUUID(), validate],
  asyncHandler(automationController.toggleAutomationRule)
);

/**
 * DELETE /api/automation/:id
 * Delete automation rule
 * Private (Owner only)
 */
router.delete(
  '/:id',
  authenticate,
  requireOwner,
  [param('id').isUUID(), validate],
  asyncHandler(automationController.deleteAutomationRule)
);

/**
 * GET /api/automation/templates
 * Get automation rule templates
 * Private
 */
router.get(
  '/templates/list',
  authenticate,
  asyncHandler(automationController.getAutomationTemplates)
);

/**
 * POST /api/automation/templates/:templateId
 * Create automation rule from template
 * Private (Owner only)
 */
router.post(
  '/templates/:templateId',
  authenticate,
  requireOwner,
  [
    param('templateId').notEmpty(),
    body('config').optional().isObject(),
    validate,
  ],
  asyncHandler(automationController.createFromTemplate)
);

export default router;