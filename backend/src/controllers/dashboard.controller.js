import { prisma } from '../config/prisma.js';

/**
 * Get comprehensive dashboard overview
 */
export const getDashboardOverview = async (req, res) => {
  const { workspaceId } = req;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const next7Days = new Date(today);
  next7Days.setDate(next7Days.getDate() + 7);

  const [
    todayBookings,
    upcomingBookings,
    completedBookings,
    noShowCount,

    newContacts,
    totalContacts,
    activeConversations,
    unansweredMessages,

    pendingForms,
    overdueForms,
    completedForms,

    // ⚠ fetch inventory first (we filter in JS)
    inventoryItems,

    activeAlerts,
    criticalAlerts,
  ] = await Promise.all([
    prisma.booking.count({
      where: {
        workspaceId,
        scheduledAt: { gte: today, lt: tomorrow },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    }),

    prisma.booking.count({
      where: {
        workspaceId,
        scheduledAt: { gte: today, lt: next7Days },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    }),

    prisma.booking.count({
      where: { workspaceId, status: 'COMPLETED' },
    }),

    prisma.booking.count({
      where: { workspaceId, status: 'NO_SHOW' },
    }),

    prisma.contact.count({
      where: {
        workspaceId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    prisma.contact.count({
      where: { workspaceId },
    }),

    prisma.conversation.count({
      where: {
        workspaceId,
        status: 'OPEN',
      },
    }),

    prisma.conversation.count({
      where: {
        workspaceId,
        status: 'OPEN',
        messages: {
          some: {
            direction: 'INBOUND',
            isRead: false,
          },
        },
      },
    }),

    prisma.formSubmission.count({
      where: { workspaceId, status: 'PENDING' },
    }),

    prisma.formSubmission.count({
      where: { workspaceId, status: 'OVERDUE' },
    }),

    prisma.formSubmission.count({
      where: { workspaceId, status: 'COMPLETED' },
    }),

    // Fetch all active inventory items
    prisma.inventoryItem.findMany({
      where: {
        workspaceId,
        isActive: true,
      },
    }),

    prisma.alert.count({
      where: { workspaceId, status: 'ACTIVE' },
    }),

    prisma.alert.count({
      where: {
        workspaceId,
        status: 'ACTIVE',
        priority: 'CRITICAL',
      },
    }),
  ]);

  // ✅ Proper low stock filtering
  const lowStockItems = inventoryItems
    .filter(item => item.quantity <= item.lowStockThreshold)
    .slice(0, 5);

  // Get recent alerts
  const recentAlerts = await prisma.alert.findMany({
    where: {
      workspaceId,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  res.json({
    success: true,
    data: {
      bookings: {
        today: todayBookings,
        upcoming: upcomingBookings,
        completed: completedBookings,
        noShow: noShowCount,
      },
      leads: {
        new: newContacts,
        total: totalContacts,
        activeConversations,
        unansweredMessages,
      },
      forms: {
        pending: pendingForms,
        overdue: overdueForms,
        completed: completedForms,
      },
      inventory: {
        lowStockItems,
        lowStockCount: lowStockItems.length,
      },
      alerts: {
        active: activeAlerts,
        critical: criticalAlerts,
        recent: recentAlerts,
      },
    },
  });
};
