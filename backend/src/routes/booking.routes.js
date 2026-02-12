import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, optionalAuth, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as bookingController from '../controllers/booking.controller.js';

const router = express.Router();

// ==========================================
// BOOKING TYPES (Service Configuration)
// ==========================================

/**
 * POST /api/bookings/types
 * Create booking type
 * Private (Owner only)
 */
router.post(
    '/types',
    authenticate,
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('description').optional(),
        body('duration').isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes'),
        body('location').optional(),
        body('price').optional().isFloat({ min: 0 }),
        body('currency').optional(),
        validate,
    ],
    asyncHandler(bookingController.createBookingType)
);

/**
 * GET /api/bookings/types
 * Get all booking types
 * Public (for booking page) or Private
 */
router.get('/types', optionalAuth, asyncHandler(bookingController.getBookingTypes));

/**
 * GET /api/bookings/types/:id
 * Get single booking type
 * Public or Private
 */
router.get('/types/:id', optionalAuth, asyncHandler(bookingController.getBookingTypeById));

/**
 * PUT /api/bookings/types/:id
 * Update booking type
 * Private (Owner only)
 */
router.put(
    '/types/:id',
    authenticate,
    [
        param('id').isUUID(),
        body('name').optional().notEmpty(),
        body('duration').optional().isInt({ min: 15 }),
        validate,
    ],
    asyncHandler(bookingController.updateBookingType)
);

/**
 * DELETE /api/bookings/types/:id
 * Delete booking type
 * Private (Owner only)
 */
router.delete(
    '/types/:id',
    authenticate,
    [param('id').isUUID(), validate],
    asyncHandler(bookingController.deleteBookingType)
);

// ==========================================
// AVAILABILITY
// ==========================================

/**
 * POST /api/bookings/types/:id/availability
 * Add availability to booking type
 * Private (Owner only)
 */
router.post(
    '/types/:id/availability',
    authenticate,
    [
        param('id').isUUID(),
        body('dayOfWeek').isIn(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
        body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
        body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
        validate,
    ],
    asyncHandler(bookingController.addAvailability)
);

/**
 * GET /api/bookings/types/:id/availability
 * Get availability for booking type
 * Public or Private
 */
router.get(
    '/types/:id/availability',
    optionalAuth,
    [param('id').isUUID(), validate],
    asyncHandler(bookingController.getAvailability)
);

/**
 * GET /api/bookings/types/:id/available-slots
 * Get available time slots for a specific date
 * Public
 */
router.get(
    '/types/:id/available-slots',
    [
        param('id').isUUID(),
        query('date').isISO8601().withMessage('Valid ISO date is required'),
        validate,
    ],
    asyncHandler(bookingController.getAvailableSlots)
);

/**
 * DELETE /api/bookings/availability/:id
 * Delete availability slot
 * Private (Owner only)
 */
router.delete(
    '/availability/:id',
    authenticate,
    [param('id').isUUID(), validate],
    asyncHandler(bookingController.deleteAvailability)
);

// ==========================================
// BOOKINGS
// ==========================================

/**
 * POST /api/bookings
 * Create new booking (public endpoint for customers)
 * Public
 */
router.post(
    '/',
    [
        body('workspaceId').isUUID().withMessage('Valid workspace ID is required'),
        body('bookingTypeId').isUUID().withMessage('Valid booking type ID is required'),
        body('scheduledAt').isISO8601().withMessage('Valid scheduled date/time is required'),
        body('customerName').notEmpty().withMessage('Customer name is required'),
        body('customerEmail').isEmail().withMessage('Valid email is required'),
        body('customerPhone').optional(),
        body('notes').optional(),
        validate,
    ],
    asyncHandler(bookingController.createBooking)
);

/**
 * GET /api/bookings
 * Get all bookings with filters
 * Private
 */
router.get(
    '/',
    authenticate,
    requirePermission('canAccessInbox'),
    [
        query('status').optional().isIn(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        validate,
    ],
    asyncHandler(bookingController.getBookings)
);

/**
 * GET /api/bookings/:id
 * Get single booking by ID
 * Private
 */
router.get(
    '/:id',
    authenticate,
    [param('id').isUUID(), validate],
    asyncHandler(bookingController.getBookingById)
);

/**
 * PUT /api/bookings/:id/status
 * Update booking status
 * Private
 */
router.put(
    '/:id/status',
    authenticate,
    requirePermission('canManageBookings'),
    [
        param('id').isUUID(),
        body('status').isIn(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
        validate,
    ],
    asyncHandler(bookingController.updateBookingStatus)
);

/**
 * DELETE /api/bookings/:id
 * Cancel booking
 * Private
 */
router.delete(
    '/:id',
    authenticate,
    requirePermission('canManageBookings'),
    [param('id').isUUID(), validate],
    asyncHandler(bookingController.cancelBooking)
);

export default router;