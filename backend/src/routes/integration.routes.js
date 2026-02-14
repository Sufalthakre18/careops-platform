import express from 'express';
import { body, param, query} from 'express-validator';
import { authenticate, requireOwner } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as integrationController from '../controllers/integration.controller.js';


const router = express.Router();

/**
 * GET /api/integrations
 * Get all integrations
 * access  Private
 */
router.get(
  '/',
  authenticate,
  asyncHandler(integrationController.getIntegrations)
);

/**
 * GET /api/integrations/:id
 * Get integration by ID
 * access  Private (Owner only)
 */
router.get(
  '/:id',
  authenticate,
  requireOwner,
  [param('id').isUUID(), validate],
  asyncHandler(integrationController.getIntegrationById)
);

/**
 * POST /api/integrations/email
 * Setup email integration (Resend)
 * access  Private (Owner only)
 */
router.post(
  '/email',
  authenticate,
  requireOwner,
  [
    body('apiKey').notEmpty().withMessage('API key is required'),
    body('fromEmail').optional().isEmail(),
    body('fromName').optional(),
    validate,
  ],
  asyncHandler(integrationController.setupEmailIntegration)
);

/**
 * PUT /api/integrations/email
 * Update email integration
 * access  Private (Owner only)
 */
router.put(
  '/email',
  authenticate,
  requireOwner,
  [
    body('apiKey').optional(),
    body('fromEmail').optional().isEmail(),
    body('fromName').optional(),
    validate,
  ],
  asyncHandler(integrationController.updateEmailIntegration)
);

/**
 * DELETE /api/integrations/email
 * Remove email integration
 * access  Private (Owner only)
 */
router.delete(
  '/email',
  authenticate,
  requireOwner,
  asyncHandler(integrationController.removeEmailIntegration)
);

/**
 * POST /api/integrations/sms
 * Setup SMS integration (Twilio)
 * access  Private (Owner only)
 */
router.post(
  '/sms',
  authenticate,
  requireOwner,
  [
    body('accountSid').notEmpty().withMessage('Account SID is required'),
    body('authToken').notEmpty().withMessage('Auth token is required'),
    body('phoneNumber').notEmpty().withMessage('Phone number is required'),
    validate,
  ],
  asyncHandler(integrationController.setupSMSIntegration)
);

/**
 * POST /api/integrations/calendar
 * Setup calendar (free: built-in only or iCal URL)
 * access  Private (Owner only)
 */
router.post(
  '/calendar',
  authenticate,
  requireOwner,
  [
    body('icalUrl').optional().trim().isString(),
    body('useBuiltInOnly').optional().isBoolean(),
    validate,
  ],
  asyncHandler(integrationController.setupCalendarIntegration)
);

export default router;

