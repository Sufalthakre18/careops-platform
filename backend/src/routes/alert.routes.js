import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as alertController from '../controllers/alert.controller.js';

const router = express.Router();

/**
 * GET /api/alerts
 * Get all alerts with filters
 * Private
 */
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED']),
    query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    query('type').optional().isIn(['INVENTORY_LOW', 'FORM_OVERDUE', 'BOOKING_UNCONFIRMED', 'MESSAGE_UNANSWERED', 'SYSTEM']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  asyncHandler(alertController.getAlerts)
);

/**
 * GET /api/alerts/summary
 * Get alerts summary (counts by status/priority)
 * Private
 */
router.get(
  '/summary',
  authenticate,
  asyncHandler(alertController.getAlertsSummary)
);


/**
 * PUT /api/alerts/bulk/acknowledge
 * Acknowledge multiple alerts
 * Private
 */
router.put(
  '/bulk/acknowledge',
  authenticate,
  [
    body('alertIds').isArray({ min: 1 }).withMessage('Alert IDs array is required'),
    body('alertIds.*').isUUID(),
    validate,
  ],
  asyncHandler(alertController.bulkAcknowledge)
);

/**
 * PUT /api/alerts/bulk/resolve
 * Resolve multiple alerts
 * Private
 */
router.put(
  '/bulk/resolve',
  authenticate,
  [
    body('alertIds').isArray({ min: 1 }).withMessage('Alert IDs array is required'),
    body('alertIds.*').isUUID(),
    validate,
  ],
  asyncHandler(alertController.bulkResolve)
);

/**
 * GET /api/alerts/:id
 * Get alert by ID
 * Private
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID(), validate],
  asyncHandler(alertController.getAlertById)
);

/**
 * PUT /api/alerts/:id/acknowledge
 * Acknowledge alert
 * Private
 */
router.put(
  '/:id/acknowledge',
  authenticate,
  [param('id').isUUID(), validate],
  asyncHandler(alertController.acknowledgeAlert)
);

/**
 * PUT /api/alerts/:id/resolve
 * Resolve alert
 * Private
 */
router.put(
  '/:id/resolve',
  authenticate,
  [param('id').isUUID(), validate],
  asyncHandler(alertController.resolveAlert)
);

/**
 * POST /api/alerts
 * Create custom alert (for testing or manual alerts)
 * Private
 */
router.post(
  '/',
  authenticate,
  [
    body('type').isIn(['INVENTORY_LOW', 'FORM_OVERDUE', 'BOOKING_UNCONFIRMED', 'MESSAGE_UNANSWERED', 'SYSTEM']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    body('title').notEmpty().withMessage('Alert title is required'),
    body('message').notEmpty().withMessage('Alert message is required'),
    body('entityType').optional(),
    body('entityId').optional().isUUID(),
    body('actionUrl').optional(),
    validate,
  ],
  asyncHandler(alertController.createAlert)
);

/**
 * DELETE /api/alerts/:id
 * Delete alert
 * Private
 */
router.delete(
  '/:id',
  authenticate,
  [param('id').isUUID(), validate],
  asyncHandler(alertController.deleteAlert)
);


export default router;