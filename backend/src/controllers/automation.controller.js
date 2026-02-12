import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Get all automation rules
 */
export const getAutomationRules = async (req, res) => {
  const rules = await prisma.automationRule.findMany({
    where: { workspaceId: req.workspaceId },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: rules,
  });
};


/**
 * Get automation rule by ID
 */
export const getAutomationRuleById = async (req, res) => {
  const rule = await prisma.automationRule.findFirst({
    where: {
      id: req.params.id,
      workspaceId: req.workspaceId,
    },
  });

  if (!rule) {
    throw new ApiError(404, 'Automation rule not found');
  }

  res.json({
    success: true,
    data: rule,
  });
};


/**
 * Create automation rule
 */
export const createAutomationRule = async (req, res) => {
  const { name, description, trigger, action, config, conditions } = req.body;

  if (!name || !trigger || !action) {
    throw new ApiError(400, 'Name, trigger and action are required');
  }

  const rule = await prisma.automationRule.create({
    data: {
      workspaceId: req.workspaceId,
      name,
      description,
      trigger,
      action,
      config: config || {},
      conditions: conditions || {},
      isActive: true,
    },
  });

  console.info(`Automation rule created: ${rule.id}`);

  res.status(201).json({
    success: true,
    message: 'Automation rule created successfully',
    data: rule,
  });
};


/**
 * Update automation rule
 */
export const updateAutomationRule = async (req, res) => {
  const { name, description, trigger, action, config, conditions, isActive } = req.body;

  const rule = await prisma.automationRule.findFirst({
    where: {
      id: req.params.id,
      workspaceId: req.workspaceId,
    },
  });

  if (!rule) {
    throw new ApiError(404, 'Automation rule not found');
  }

  const updatedRule = await prisma.automationRule.update({
    where: { id: rule.id },
    data: {
      name,
      description,
      trigger,
      action,
      config,
      conditions,
      isActive,
    },
  });

  console.info(`Automation rule updated: ${rule.id}`);

  res.json({
    success: true,
    message: 'Automation rule updated successfully',
    data: updatedRule,
  });
};


/**
 * Toggle automation rule
 */
export const toggleAutomationRule = async (req, res) => {
  const rule = await prisma.automationRule.findFirst({
    where: {
      id: req.params.id,
      workspaceId: req.workspaceId,
    },
  });

  if (!rule) {
    throw new ApiError(404, 'Automation rule not found');
  }

  const updatedRule = await prisma.automationRule.update({
    where: { id: rule.id },
    data: { isActive: !rule.isActive },
  });

  console.info(
    `Automation rule ${updatedRule.isActive ? 'activated' : 'deactivated'}: ${rule.id}`
  );

  res.json({
    success: true,
    message: `Automation rule ${
      updatedRule.isActive ? 'activated' : 'deactivated'
    } successfully`,
    data: updatedRule,
  });
};


/**
 * Delete automation rule
 */
export const deleteAutomationRule = async (req, res) => {
  const rule = await prisma.automationRule.findFirst({
    where: {
      id: req.params.id,
      workspaceId: req.workspaceId,
    },
  });

  if (!rule) {
    throw new ApiError(404, 'Automation rule not found');
  }

  await prisma.automationRule.delete({
    where: { id: rule.id },
  });

  console.info(`Automation rule deleted: ${rule.id}`);

  res.json({
    success: true,
    message: 'Automation rule deleted successfully',
  });
};

/**
 * Get automation templates
 */
export const getAutomationTemplates = async (req, res) => {
  const templates = [
    {
      id: 'welcome-email',
      name: 'Welcome Email for New Contacts',
      description: 'Send a welcome email when a new contact is created',
      trigger: 'NEW_CONTACT',
      action: 'SEND_EMAIL',
      config: {
        subject: 'Welcome to {{businessName}}!',
        template: `
          <h1>Welcome, {{firstName}}!</h1>
          <p>Thank you for reaching out to {{businessName}}. We've received your inquiry and will get back to you shortly.</p>
          <p>Best regards,<br>{{businessName}} Team</p>
        `,
      },
    },
    {
      id: 'booking-confirmation',
      name: 'Booking Confirmation Email',
      description: 'Send confirmation when a booking is created',
      trigger: 'BOOKING_CREATED',
      action: 'SEND_EMAIL',
      config: {
        subject: 'Booking Confirmed - {{businessName}}',
        template: `
          <h1>Booking Confirmed!</h1>
          <p>Hi {{firstName}},</p>
          <p>Your booking for {{serviceName}} has been confirmed.</p>
          <p><strong>Date:</strong> {{bookingDate}}<br>
          <strong>Time:</strong> {{bookingTime}}</p>
          <p>We look forward to seeing you!</p>
          <p>Best regards,<br>{{businessName}} Team</p>
        `,
      },
    },
    {
      id: 'booking-reminder',
      name: 'Booking Reminder',
      description: 'Send reminder before booking',
      trigger: 'BOOKING_REMINDER',
      action: 'SEND_EMAIL',
      config: {
        subject: 'Reminder: Upcoming appointment at {{businessName}}',
        template: `
          <h1>Appointment Reminder</h1>
          <p>Hi {{firstName}},</p>
          <p>This is a friendly reminder about your upcoming appointment:</p>
          <p><strong>Service:</strong> {{serviceName}}<br>
          <strong>Date:</strong> {{bookingDate}}<br>
          <strong>Time:</strong> {{bookingTime}}</p>
          <p>See you soon!</p>
        `,
      },
    },
    {
      id: 'form-reminder',
      name: 'Form Completion Reminder',
      description: 'Remind about pending forms',
      trigger: 'FORM_PENDING',
      action: 'SEND_EMAIL',
      config: {
        subject: 'Action Required: Complete your form',
        template: `
          <h1>Form Pending</h1>
          <p>Hi {{firstName}},</p>
          <p>We're still waiting for you to complete the following form:</p>
          <p><strong>{{formName}}</strong></p>
          <p>Please complete it at your earliest convenience.</p>
        `,
      },
    },
    {
      id: 'low-stock-alert',
      name: 'Low Inventory Alert',
      description: 'Create alert when inventory is low',
      trigger: 'INVENTORY_LOW',
      action: 'CREATE_ALERT',
      config: {
        alertType: 'INVENTORY_LOW',
        priority: 'HIGH',
        title: 'Low Inventory Alert',
        message: 'Inventory item is running low and needs restocking',
      },
    },
    {
      id: 'form-overdue-alert',
      name: 'Overdue Form Alert',
      description: 'Create alert for overdue forms',
      trigger: 'FORM_OVERDUE',
      action: 'CREATE_ALERT',
      config: {
        alertType: 'FORM_OVERDUE',
        priority: 'MEDIUM',
        title: 'Form Overdue',
        message: 'A form submission is overdue',
      },
    },
  ];

  res.json({
    success: true,
    data: templates,
  });
};

/**
 * Create automation rule from template
 */
export const createFromTemplate = async (req, res) => {
  const { templateId } = req.params;
  const { config: customConfig } = req.body;

  // Get template
  const templates = {
    'welcome-email': {
      name: 'Welcome Email for New Contacts',
      trigger: 'NEW_CONTACT',
      action: 'SEND_EMAIL',
      config: customConfig || {
        subject: 'Welcome to {{businessName}}!',
        template: '<h1>Welcome!</h1><p>Thank you for contacting us.</p>',
      },
    },
    'booking-confirmation': {
      name: 'Booking Confirmation Email',
      trigger: 'BOOKING_CREATED',
      action: 'SEND_EMAIL',
      config: customConfig || {
        subject: 'Booking Confirmed',
        template: '<h1>Booking Confirmed!</h1>',
      },
    },
    'low-stock-alert': {
      name: 'Low Inventory Alert',
      trigger: 'INVENTORY_LOW',
      action: 'CREATE_ALERT',
      config: customConfig || {
        alertType: 'INVENTORY_LOW',
        priority: 'HIGH',
        title: 'Low Inventory',
        message: 'Stock is running low',
      },
    },
  };

  const template = templates[templateId];

  if (!template) {
    throw new ApiError(404, 'Template not found');
  }

  const rule = await prisma.automationRule.create({
    data: {
      workspaceId: req.workspaceId,
      name: template.name,
      description: `Created from template: ${templateId}`,
      trigger: template.trigger,
      action: template.action,
      config: template.config,
      isActive: true,
    },
  });

  console.info(`Automation rule created from template: ${templateId}`);

  res.status(201).json({
    success: true,
    message: 'Automation rule created from template successfully',
    data: rule,
  });
};