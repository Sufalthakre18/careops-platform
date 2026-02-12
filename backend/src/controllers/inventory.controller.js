import { prisma } from '../config/prisma.js';
import { emitToWorkspace } from '../server.js';
import { ApiError } from '../middleware/errorHandler.js';
import { paginate, paginationMeta } from '../utils/helpers.js';
import automationService from '../services/automation.service.js';
import emailService from '../services/email.service.js';

/**
 * Create inventory item
 */
export const createInventoryItem = async (req, res) => {
  const {
    name,
    description,
    sku,
    quantity = 0,
    unit = 'PIECE',
    lowStockThreshold = 0,
    vendorName,
    vendorEmail,
    vendorPhone,
  } = req.body;

  if (!name) {
    throw new ApiError(400, 'Item name is required');
  }

  const item = await prisma.inventoryItem.create({
    data: {
      workspaceId: req.workspaceId,
      name,
      description,
      sku,
      quantity,
      unit,
      lowStockThreshold,
      vendorName,
      vendorEmail,
      vendorPhone,
      isActive: true,
    },
  });

  await prisma.workspace.update({
    where: { id: req.workspaceId },
    data: { inventorySetup: true },
  });

  if (item.quantity <= item.lowStockThreshold) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.workspaceId },
    });
    await automationService.triggerInventoryLow(item, workspace);
  }

  res.status(201).json({
    success: true,
    message: 'Inventory item created successfully',
    data: item,
  });
};

/**
 * Get inventory items
 */
export const getInventoryItems = async (req, res) => {
  const { page = 1, limit = 20, lowStock } = req.query;
  const { skip, take } = paginate(page, limit);

  let where = {
    workspaceId: req.workspaceId,
    isActive: true,
  };

  // If lowStock filter is requested
  if (lowStock === 'true') {
    const items = await prisma.$queryRaw`
      SELECT * FROM inventory_items
      WHERE workspace_id = ${req.workspaceId}
      AND is_active = true
      AND quantity <= low_stock_threshold
      ORDER BY quantity ASC
      LIMIT ${take} OFFSET ${skip}
    `;

    return res.json({
      success: true,
      data: items,
    });
  }

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      include: {
        usageLog: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take,
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  res.json({
    success: true,
    data: items,
    meta: paginationMeta(total, parseInt(page), parseInt(limit)),
  });
};

/**
 * Update inventory quantity (SET exact value)
 */
export const updateQuantity = async (req, res) => {
  const { quantity, reason, bookingId } = req.body;

  if (quantity === undefined) {
    throw new ApiError(400, 'Quantity is required');
  }

  const item = await prisma.inventoryItem.findUnique({
    where: { id: req.params.id },
  });

  if (!item || item.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Inventory item not found');
  }

  const adjustment = quantity - item.quantity;

  const updatedItem = await prisma.inventoryItem.update({
    where: { id: req.params.id },
    data: { quantity },
  });

  // Log actual adjustment difference
  await prisma.inventoryUsage.create({
    data: {
      inventoryItemId: item.id,
      quantity: adjustment,
      reason: reason || 'Manual set adjustment',
      bookingId,
      createdBy: req.userId,
    },
  });

  if (
    updatedItem.quantity <= updatedItem.lowStockThreshold &&
    item.quantity > item.lowStockThreshold
  ) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.workspaceId },
    });

    await automationService.triggerInventoryLow(updatedItem, workspace);

    try {
      await emailService.sendInventoryAlert(updatedItem, workspace);
    } catch (err) {
      console.error('Inventory alert email failed:', err);
    }
  }

  emitToWorkspace(req.workspaceId, 'inventory:updated', updatedItem);

  res.json({
    success: true,
    message: 'Inventory quantity updated successfully',
    data: updatedItem,
  });
};

/**
 * Adjust inventory (+ or -)
 */
export const adjustInventory = async (req, res) => {
  const { adjustment, reason } = req.body;

  if (!adjustment) {
    throw new ApiError(400, 'Adjustment value is required');
  }

  const item = await prisma.inventoryItem.findUnique({
    where: { id: req.params.id },
  });

  if (!item || item.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Inventory item not found');
  }

  const newQuantity = item.quantity + adjustment;

  if (newQuantity < 0) {
    throw new ApiError(400, 'Cannot reduce inventory below zero');
  }

  const updatedItem = await prisma.inventoryItem.update({
    where: { id: req.params.id },
    data: { quantity: newQuantity },
  });

  await prisma.inventoryUsage.create({
    data: {
      inventoryItemId: item.id,
      quantity: adjustment,
      reason,
      createdBy: req.userId,
    },
  });

  if (
    updatedItem.quantity <= updatedItem.lowStockThreshold &&
    item.quantity > item.lowStockThreshold
  ) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.workspaceId },
    });

    await automationService.triggerInventoryLow(updatedItem, workspace);

    try {
      await emailService.sendInventoryAlert(updatedItem, workspace);
    } catch (err) {
      console.error('Inventory alert email failed:', err);
    }
  }

  emitToWorkspace(req.workspaceId, 'inventory:adjusted', updatedItem);

  res.json({
    success: true,
    message: `Inventory ${adjustment > 0 ? 'increased' : 'decreased'} by ${Math.abs(adjustment)}`,
    data: updatedItem,
  });
};


/**
 * Get inventory item by ID
 */
export const getInventoryItemById = async (req, res) => {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: req.params.id },
    include: {
      usageLog: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!item || item.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Inventory item not found');
  }

  res.json({
    success: true,
    data: item,
  });
};

/**
 * Update inventory item details (NOT quantity)
 */
export const updateInventoryItem = async (req, res) => {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: req.params.id },
  });

  if (!item || item.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Inventory item not found');
  }

  const updatedItem = await prisma.inventoryItem.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name ?? item.name,
      description: req.body.description ?? item.description,
      sku: req.body.sku ?? item.sku,
      unit: req.body.unit ?? item.unit,
      lowStockThreshold:
        req.body.lowStockThreshold ?? item.lowStockThreshold,
      vendorName: req.body.vendorName ?? item.vendorName,
      vendorEmail: req.body.vendorEmail ?? item.vendorEmail,
      vendorPhone: req.body.vendorPhone ?? item.vendorPhone,
    },
  });

  emitToWorkspace(req.workspaceId, 'inventory:updated', updatedItem);

  res.json({
    success: true,
    message: 'Inventory item updated successfully',
    data: updatedItem,
  });
};


/**
 * Delete inventory item (Soft delete)
 */
export const deleteInventoryItem = async (req, res) => {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: req.params.id },
  });

  if (!item || item.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Inventory item not found');
  }

  // Soft delete (recommended)
  await prisma.inventoryItem.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  emitToWorkspace(req.workspaceId, 'inventory:deleted', {
    id: item.id,
  });

  res.json({
    success: true,
    message: 'Inventory item deleted successfully',
  });
};


/**
 * Get low stock inventory items
 */
export const getLowStockItems = async (req, res) => {
  const items = await prisma.inventoryItem.findMany({
    where: {
      workspaceId: req.workspaceId,
      isActive: true,
    },
    orderBy: {
      quantity: 'asc',
    },
  });

  // Filter in JS (safe & simple)
  const lowStockItems = items.filter(
    (item) => item.quantity <= item.lowStockThreshold
  );

  res.json({
    success: true,
    data: lowStockItems,
  });
};


/**
 * Get usage history for inventory item
 */
export const getUsageHistory = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const item = await prisma.inventoryItem.findUnique({
    where: { id: req.params.id },
  });

  if (!item || item.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Inventory item not found');
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [usage, total] = await Promise.all([
    prisma.inventoryUsage.findMany({
      where: {
        inventoryItemId: item.id,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.inventoryUsage.count({
      where: {
        inventoryItemId: item.id,
      },
    }),
  ]);

  res.json({
    success: true,
    data: usage,
    meta: paginationMeta(total, parseInt(page), parseInt(limit)),
  });
};
