import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, requireOwner, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as formController from '../controllers/form.controller.js';

const router = express.Router();

/**
 * POST /api/forms
 * Create new form
 * Private (Owner only)
 */
router.post(
  '/',
  authenticate,
  requireOwner,
  [
    body('name').notEmpty().withMessage('Form name is required'),
    body('description').optional(),
    body('type').isIn(['CONTACT', 'INTAKE', 'AGREEMENT', 'CUSTOM']).withMessage('Invalid form type'),
    body('config').isObject().withMessage('Form config must be an object'),
    body('externalUrl').optional().isURL(),
    body('externalProvider').optional(),
    validate,
  ],
  asyncHandler(formController.createForm)
);

/**
 * GET /api/forms
 * Get all forms
 * Private
 */
router.get(
  '/',
  authenticate,
  requirePermission('canViewForms'),
  asyncHandler(formController.getForms)
);

/**
 * GET /api/forms/:id
 * Get form by ID
 * Private
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID(), validate],
  asyncHandler(formController.getFormById)
);

/**
 * PUT /api/forms/:id
 * Update form
 * Private (Owner only)
 */
router.put(
  '/:id',
  authenticate,
  requireOwner,
  [
    param('id').isUUID(),
    body('name').optional(),
    body('config').optional().isObject(),
    validate,
  ],
  asyncHandler(formController.updateForm)
);

/**
 * DELETE /api/forms/:id
 * Delete form
 * Private (Owner only)
 */
router.delete(
  '/:id',
  authenticate,
  requireOwner,
  [param('id').isUUID(), validate],
  asyncHandler(formController.deleteForm)
);

/**
 * POST /api/forms/:formId/booking-types/:bookingTypeId
 * Link form to booking type
 * Private (Owner only)
 */
router.post(
  '/:formId/booking-types/:bookingTypeId',
  authenticate,
  requireOwner,
  [
    param('formId').isUUID(),
    param('bookingTypeId').isUUID(),
    body('sendAfterBooking').optional().isBoolean(),
    body('reminderAfterDays').optional().isInt({ min: 1 }),
    validate,
  ],
  asyncHandler(formController.linkFormToBookingType)
);

/**
 * GET /api/forms/submissions
 * Get all form submissions
 * Private
 */
router.get(
  '/submissions/all',
  authenticate,
  requirePermission('canViewForms'),
  [
    query('status').optional().isIn(['PENDING', 'COMPLETED', 'OVERDUE']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  asyncHandler(formController.getFormSubmissions)
);

/**
 * GET /api/forms/submissions/:id
 * Get form submission by ID
 * Public (with submission ID)
 */
router.get(
  '/submissions/:id',
  [param('id').isUUID(), validate],
  asyncHandler(formController.getFormSubmissionById)
);

/**
 * POST /api/forms/:formId/submissions
 * Create & submit form (public)
 */
router.post(
  '/:formId/submissions',
  [
    param('formId').isUUID(),
    body('data').isObject().withMessage('Form data is required'),
    validate,
  ],
  asyncHandler(formController.createAndSubmitForm)
);

/**
 * POST /api/forms/submissions/:id
 * Submit form data (public endpoint)
 * Public
 */
router.post(
  '/submissions/:id',
  [
    param('id').isUUID(),
    body('data').isObject().withMessage('Form data is required'),
    validate,
  ],
  asyncHandler(formController.submitForm)
);




export default router;


// api tested