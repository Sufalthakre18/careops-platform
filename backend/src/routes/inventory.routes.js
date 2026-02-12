import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, requireOwner, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as inventoryController from '../controllers/inventory.controller.js';

const router = express.Router();

/**
 * POST /api/inventory
 * Create inventory item
 * Private (Owner only)
 */
router.post(
  '/',
  authenticate,
  requireOwner,
  [
    body('name').notEmpty().withMessage('Item name is required'),
    body('description').optional(),
    body('sku').optional(),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive integer'),
    body('unit').optional().isIn(['PIECE', 'BOX', 'BOTTLE', 'PACK', 'KG', 'LITER', 'OTHER']),
    body('lowStockThreshold').isInt({ min: 0 }).withMessage('Threshold must be a positive integer'),
    body('vendorName').optional(),
    body('vendorEmail').optional().isEmail(),
    body('vendorPhone').optional(),
    validate,
  ],
  asyncHandler(inventoryController.createInventoryItem)
);

/**
 * GET /api/inventory
 * Get all inventory items
 * Private
 */
router.get(
  '/',
  authenticate,
  requirePermission('canViewInventory'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('lowStock').optional().isBoolean(),
    validate,
  ],
  asyncHandler(inventoryController.getInventoryItems)
);

/**
 * GET /api/inventory/:id
 * Get inventory item by ID
 * Private
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('canViewInventory'),
  [param('id').isUUID(), validate],
  asyncHandler(inventoryController.getInventoryItemById)
);

/**
 * PUT /api/inventory/:id
 * Update inventory item
 * Private (Owner or Manager)
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('canManageInventory'),
  [
    param('id').isUUID(),
    body('name').optional(),
    body('description').optional(),
    body('lowStockThreshold').optional().isInt({ min: 0 }),
    body('vendorName').optional(),
    body('vendorEmail').optional().isEmail(),
    body('vendorPhone').optional(),
    validate,
  ],
  asyncHandler(inventoryController.updateInventoryItem)
);

/**
 * PUT /api/inventory/:id/quantity
 * Update inventory quantity
 * Private (Owner or Manager)
 */
router.put(
  '/:id/quantity',
  authenticate,
  requirePermission('canManageInventory'),
  [
    param('id').isUUID(),
    body('quantity').isInt().withMessage('Quantity must be an integer'),
    body('reason').optional(),
    body('bookingId').optional().isUUID(),
    validate,
  ],
  asyncHandler(inventoryController.updateQuantity)
);

/**
 * POST /api/inventory/:id/adjust
 * Adjust inventory (add or subtract)
 * Private (Owner or Manager)
 */
router.post(
  '/:id/adjust',
  authenticate,
  requirePermission('canManageInventory'),
  [
    param('id').isUUID(),
    body('adjustment').isInt().withMessage('Adjustment must be an integer'),
    body('reason').notEmpty().withMessage('Reason is required'),
    validate,
  ],
  asyncHandler(inventoryController.adjustInventory)
);

/**
 * GET /api/inventory/:id/usage
 * Get usage history for inventory item
 * Private
 */
router.get(
  '/:id/usage',
  authenticate,
  requirePermission('canViewInventory'),
  [
    param('id').isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  asyncHandler(inventoryController.getUsageHistory)
);

/**
 * DELETE /api/inventory/:id
 * Delete inventory item
 * Private (Owner only)
 */
router.delete(
  '/:id',
  authenticate,
  requireOwner,
  [param('id').isUUID(), validate],
  asyncHandler(inventoryController.deleteInventoryItem)
);

/**
 * GET /api/inventory/alerts/low-stock
 * Get low stock items
 * Private
 */
router.get(
  '/alerts/low-stock',
  authenticate,
  requirePermission('canViewInventory'),
  asyncHandler(inventoryController.getLowStockItems)
);

export default router;

// checked all apis