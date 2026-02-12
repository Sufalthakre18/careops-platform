import { prisma } from '../config/prisma.js';
import { emitToWorkspace } from '../server.js';
import { ApiError } from '../middleware/errorHandler.js';
import { paginate, paginationMeta } from '../utils/helpers.js';

/**
 * Get all alerts with filters
 */
export const getAlerts = async (req, res) => {
  const { status, priority, type, page = 1, limit = 20 } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {
    workspaceId: req.workspaceId,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(type && { type }),
  };

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // Active first
        { priority: 'desc' }, // Critical first
        { createdAt: 'desc' },
      ],
      skip,
      take,
    }),
    prisma.alert.count({ where }),
  ]);

  res.json({
    success: true,
    data: alerts,
    meta: paginationMeta(total, parseInt(page), parseInt(limit)),
  });
};

/**
 * Get alerts summary
 */
export const getAlertsSummary = async (req, res) => {
  const [
    totalActive,
    totalAcknowledged,
    totalResolved,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
  ] = await Promise.all([
    prisma.alert.count({
      where: { workspaceId: req.workspaceId, status: 'ACTIVE' },
    }),
    prisma.alert.count({
      where: { workspaceId: req.workspaceId, status: 'ACKNOWLEDGED' },
    }),
    prisma.alert.count({
      where: { workspaceId: req.workspaceId, status: 'RESOLVED' },
    }),
    prisma.alert.count({
      where: { workspaceId: req.workspaceId, status: 'ACTIVE', priority: 'CRITICAL' },
    }),
    prisma.alert.count({
      where: { workspaceId: req.workspaceId, status: 'ACTIVE', priority: 'HIGH' },
    }),
    prisma.alert.count({
      where: { workspaceId: req.workspaceId, status: 'ACTIVE', priority: 'MEDIUM' },
    }),
    prisma.alert.count({
      where: { workspaceId: req.workspaceId, status: 'ACTIVE', priority: 'LOW' },
    }),
  ]);

  res.json({
    success: true,
    data: {
      byStatus: {
        active: totalActive,
        acknowledged: totalAcknowledged,
        resolved: totalResolved,
      },
      byPriority: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
      },
      total: totalActive + totalAcknowledged + totalResolved,
    },
  });
};

/**
 * Get alert by ID
 */
export const getAlertById = async (req, res) => {
  const alert = await prisma.alert.findUnique({
    where: { id: req.params.id },
  });

  if (!alert || alert.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Alert not found');
  }

  res.json({
    success: true,
    data: alert,
  });
};

/**
 * Acknowledge alert
 */
export const acknowledgeAlert = async (req, res) => {
  const alert = await prisma.alert.findUnique({
    where: { id: req.params.id },
  });

  if (!alert || alert.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Alert not found');
  }

  if (alert.status !== 'ACTIVE') {
    throw new ApiError(400, 'Only active alerts can be acknowledged');
  }

  const updatedAlert = await prisma.alert.update({
    where: { id: req.params.id },
    data: {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
      acknowledgedBy: req.userId,
    },
  });

  // Emit real-time event
  emitToWorkspace(req.workspaceId, 'alert:acknowledged', updatedAlert);

  console.info(`Alert acknowledged: ${alert.id} by user ${req.userId}`);

  res.json({
    success: true,
    message: 'Alert acknowledged successfully',
    data: updatedAlert,
  });
};

/**
 * Resolve alert
 */
export const resolveAlert = async (req, res) => {
  const alert = await prisma.alert.findUnique({
    where: { id: req.params.id },
  });

  if (!alert || alert.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Alert not found');
  }

  const updatedAlert = await prisma.alert.update({
    where: { id: req.params.id },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      ...(alert.status === 'ACTIVE' && {
        acknowledgedAt: new Date(),
        acknowledgedBy: req.userId,
      }),
    },
  });

  // Emit real-time event
  emitToWorkspace(req.workspaceId, 'alert:resolved', updatedAlert);

  console.info(`Alert resolved: ${alert.id} by user ${req.userId}`);

  res.json({
    success: true,
    message: 'Alert resolved successfully',
    data: updatedAlert,
  });
};

/**
 * Create custom alert
 */
export const createAlert = async (req, res) => {
  const { type, priority = 'MEDIUM', title, message, entityType, entityId, actionUrl } = req.body;

  const alert = await prisma.alert.create({
    data: {
      workspaceId: req.workspaceId,
      type,
      priority,
      status: 'ACTIVE',
      title,
      message,
      entityType,
      entityId,
      actionUrl,
    },
  });

  // Emit real-time event
  emitToWorkspace(req.workspaceId, 'alert:created', alert);

  console.info(`Alert created: ${alert.id}`);

  res.status(201).json({
    success: true,
    message: 'Alert created successfully',
    data: alert,
  });
};

/**
 * Delete alert
 */
export const deleteAlert = async (req, res) => {
  const alert = await prisma.alert.findUnique({
    where: { id: req.params.id },
  });

  if (!alert || alert.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Alert not found');
  }

  await prisma.alert.delete({
    where: { id: req.params.id },
  });

  // Emit real-time event
  emitToWorkspace(req.workspaceId, 'alert:deleted', { id: req.params.id });

  res.json({
    success: true,
    message: 'Alert deleted successfully',
  });
};

/**
 * Bulk acknowledge alerts
 */
export const bulkAcknowledge = async (req, res) => {
  const { alertIds } = req.body;

  if (!Array.isArray(alertIds) || alertIds.length === 0) {
    throw new ApiError(400, 'alertIds must be a non-empty array');
  }

  const alerts = await prisma.alert.findMany({
    where: {
      id: { in: alertIds },
      workspaceId: req.workspaceId,
    },
  });

  if (alerts.length !== alertIds.length) {
    throw new ApiError(400, 'Some alerts not found or unauthorized');
  }

  const result = await prisma.alert.updateMany({
    where: {
      id: { in: alertIds },
      workspaceId: req.workspaceId,
      status: 'ACTIVE',
    },
    data: {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
      acknowledgedBy: req.userId,
    },
  });

  emitToWorkspace(req.workspaceId, 'alerts:bulk-acknowledged', {
    count: result.count,
    alertIds,
  });

  res.json({
    success: true,
    message: `${result.count} alert(s) acknowledged`,
    data: { count: result.count },
  });
};


/**
 * Bulk resolve alerts
 */
export const bulkResolve = async (req, res) => {
  const { alertIds } = req.body;

  if (!Array.isArray(alertIds) || alertIds.length === 0) {
    throw new ApiError(400, 'alertIds must be a non-empty array');
  }

  const alerts = await prisma.alert.findMany({
    where: {
      id: { in: alertIds },
      workspaceId: req.workspaceId,
    },
  });

  if (alerts.length !== alertIds.length) {
    throw new ApiError(400, 'Some alerts not found or unauthorized');
  }

  const result = await prisma.alert.updateMany({
    where: {
      id: { in: alertIds },
      workspaceId: req.workspaceId, // ✅ SECURITY FIX
      status: { not: 'RESOLVED' },
    },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
    },
  });

  emitToWorkspace(req.workspaceId, 'alerts:bulk-resolved', {
    count: result.count,
    alertIds,
  });

  res.json({
    success: true,
    message: `${result.count} alert(s) resolved`,
    data: { count: result.count },
  });
};
