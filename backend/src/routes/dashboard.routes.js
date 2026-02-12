import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = express.Router();

/**
 * GET /api/dashboard/overview
 * Get dashboard overview with all key metrics
 * Private
 */
router.get('/overview', authenticate, asyncHandler(dashboardController.getDashboardOverview));

/**
 * GET /api/dashboard/bookings-today
 * Get today's bookings
 * Private
 */
router.get('/bookings-today', authenticate, asyncHandler(dashboardController.getTodayBookings));

/**
 * GET /api/dashboard/upcoming-bookings
 * Get upcoming bookings (next 7 days)
 * Private
 */
router.get('/upcoming-bookings', authenticate, asyncHandler(dashboardController.getUpcomingBookings));

/**
 * GET /api/dashboard/recent-activity
 * Get recent activity feed
 * Private
 */
router.get('/recent-activity', authenticate, asyncHandler(dashboardController.getRecentActivity));

export default router;



// checked all apis