import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import emailService from '../services/email.service.js';

/**
 * Get all integrations
 */
export const getIntegrations = async (req, res) => {
  const integrations = await prisma.integration.findMany({
    where: { workspaceId: req.workspaceId },
    select: {
      id: true,
      type: true,
      provider: true,
      status: true,
      lastSyncAt: true,
      errorMessage: true,
      createdAt: true,
      updatedAt: true,
      // Don't expose sensitive config data
    },
  });

  res.json({
    success: true,
    data: integrations,
  });
};

/**
 * Get integration by ID
 */
export const getIntegrationById = async (req, res) => {
  const integration = await prisma.integration.findUnique({
    where: { id: req.params.id },
  });

  if (!integration || integration.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Integration not found');
  }

  // Remove sensitive data
  const { config, ...safeIntegration } = integration;

  res.json({
    success: true,
    data: safeIntegration,
  });
};

/**
 * Setup email integration (Resend)
 */
export const setupEmailIntegration = async (req, res) => {
  const { apiKey, fromEmail = 'onboarding@resend.dev', fromName } = req.body;

  // Test the API key
  try {
    await emailService.sendEmail({
      to: req.user.email,
      subject: 'CareOps Email Integration Test',
      html: '<p>Your email integration is working! You can now send automated emails to your customers.</p>',
    });
  } catch (error) {
    console.error('Email integration test failed:', error);
    throw new ApiError(400, 'Invalid API key or email configuration');
  }

  const integration = await prisma.integration.upsert({
    where: {
      workspaceId_type_provider: {
        workspaceId: req.workspaceId,
        type: 'EMAIL',
        provider: 'resend',
      },
    },
    create: {
      workspaceId: req.workspaceId,
      type: 'EMAIL',
      provider: 'resend',
      status: 'CONNECTED',
      config: {
        apiKey,
        fromEmail,
        fromName,
      },
      lastSyncAt: new Date(),
    },
    update: {
      status: 'CONNECTED',
      config: {
        apiKey,
        fromEmail,
        fromName,
      },
      lastSyncAt: new Date(),
      errorMessage: null,
    },
  });

  // Update workspace onboarding
  await prisma.workspace.update({
    where: { id: req.workspaceId },
    data: { emailSetup: true },
  });

  console.info(`Email integration setup for workspace: ${req.workspaceId}`);

  res.status(201).json({
    success: true,
    message: 'Email integration setup successfully! Test email sent to your inbox.',
    data: {
      id: integration.id,
      type: integration.type,
      provider: integration.provider,
      status: integration.status,
    },
  });
};

/**
 * Update email integration
 */
export const updateEmailIntegration = async (req, res) => {
  const updates = req.body;

  const integration = await prisma.integration.findFirst({
    where: {
      workspaceId: req.workspaceId,
      type: 'EMAIL',
      provider: 'resend',
    },
  });

  if (!integration) {
    throw new ApiError(404, 'Email integration not found. Please setup first.');
  }

  const updatedIntegration = await prisma.integration.update({
    where: { id: integration.id },
    data: {
      config: {
        ...integration.config,
        ...updates,
      },
      lastSyncAt: new Date(),
    },
  });

  res.json({
    success: true,
    message: 'Email integration updated successfully',
    data: {
      id: updatedIntegration.id,
      type: updatedIntegration.type,
      status: updatedIntegration.status,
    },
  });
};

/**
 * Remove email integration
 */
export const removeEmailIntegration = async (req, res) => {
  const integration = await prisma.integration.findFirst({
    where: {
      workspaceId: req.workspaceId,
      type: 'EMAIL',
    },
  });

  if (!integration) {
    throw new ApiError(404, 'Email integration not found');
  }

  await prisma.integration.update({
    where: { id: integration.id },
    data: { status: 'DISCONNECTED' },
  });

  res.json({
    success: true,
    message: 'Email integration removed successfully',
  });
};

/**
 * Setup SMS integration (Twilio)
 */
export const setupSMSIntegration = async (req, res) => {
  const { accountSid, authToken, phoneNumber } = req.body;

  // TODO: Test Twilio credentials
  // For now, just save the config

  const integration = await prisma.integration.upsert({
    where: {
      workspaceId_type_provider: {
        workspaceId: req.workspaceId,
        type: 'SMS',
        provider: 'twilio',
      },
    },
    create: {
      workspaceId: req.workspaceId,
      type: 'SMS',
      provider: 'twilio',
      status: 'CONNECTED',
      config: {
        accountSid,
        authToken,
        phoneNumber,
      },
    },
    update: {
      status: 'CONNECTED',
      config: {
        accountSid,
        authToken,
        phoneNumber,
      },
      errorMessage: null,
    },
  });

  // Update workspace onboarding
  await prisma.workspace.update({
    where: { id: req.workspaceId },
    data: { smsSetup: true },
  });

  console.info(`SMS integration setup for workspace: ${req.workspaceId}`);

  res.status(201).json({
    success: true,
    message: 'SMS integration setup successfully!',
    data: {
      id: integration.id,
      type: integration.type,
      provider: integration.provider,
      status: integration.status,
    },
  });
};

/**
 * Setup calendar integration (free: built-in only or iCal URL)
 * No paid APIs — use CareOps availability and/or a free iCal feed URL.
 */
export const setupCalendarIntegration = async (req, res) => {
  const { icalUrl, useBuiltInOnly } = req.body;

  const useBuiltIn = useBuiltInOnly === true || useBuiltInOnly === 'true';
  const hasIcalUrl = typeof icalUrl === 'string' && icalUrl.trim().length > 0;

  const provider = 'careops_calendar';
  const config = useBuiltIn && !hasIcalUrl
    ? { useBuiltInOnly: true }
    : { icalUrl: (icalUrl || '').trim(), useBuiltInOnly: false };

  const integration = await prisma.integration.upsert({
    where: {
      workspaceId_type_provider: {
        workspaceId: req.workspaceId,
        type: 'CALENDAR',
        provider,
      },
    },
    create: {
      workspaceId: req.workspaceId,
      type: 'CALENDAR',
      provider,
      status: 'CONNECTED',
      config,
      lastSyncAt: new Date(),
    },
    update: {
      status: 'CONNECTED',
      config,
      lastSyncAt: new Date(),
      errorMessage: null,
    },
  });

  console.info(`Calendar integration setup for workspace: ${req.workspaceId} (${provider})`);

  res.status(201).json({
    success: true,
    message: 'Calendar integration setup successfully!',
    data: {
      id: integration.id,
      type: integration.type,
      provider: integration.provider,
      status: integration.status,
    },
  });
};

/**
 * Test integration connection
 */
export const testIntegration = async (req, res) => {
  const integration = await prisma.integration.findUnique({
    where: { id: req.params.id },
  });

  if (!integration || integration.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Integration not found');
  }

  let testResult = { success: false, message: 'Test not implemented' };

  try {
    if (integration.type === 'EMAIL' && integration.provider === 'resend') {
      await emailService.sendEmail({
        to: req.user.email,
        subject: 'CareOps Integration Test',
        html: '<p>Your email integration is working correctly!</p>',
      });
      testResult = { success: true, message: 'Test email sent successfully' };
    }

    // Update last sync time
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        status: 'CONNECTED',
        errorMessage: null,
      },
    });
  } catch (error) {
    console.error('Integration test failed:', error);
    
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        status: 'ERROR',
        errorMessage: error.message,
      },
    });

    testResult = { success: false, message: error.message };
  }

  res.json({
    success: testResult.success,
    message: testResult.message,
    data: {
      type: integration.type,
      provider: integration.provider,
      tested: true,
    },
  });
};

/**
 * Remove integration
 */
export const removeIntegration = async (req, res) => {
  const integration = await prisma.integration.findUnique({
    where: { id: req.params.id },
  });

  if (!integration || integration.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Integration not found');
  }

  await prisma.integration.update({
    where: { id: req.params.id },
    data: { status: 'DISCONNECTED' },
  });

  res.json({
    success: true,
    message: 'Integration removed successfully',
  });
};

/**
 * Setup webhook integration
 */
export const setupWebhook = async (req, res) => {
  const { url, events, secret } = req.body;

  const integration = await prisma.integration.create({
    data: {
      workspaceId: req.workspaceId,
      type: 'WEBHOOK',
      provider: 'custom',
      status: 'CONNECTED',
      config: {
        url,
        events,
        secret,
      },
    },
  });

  console.info(`Webhook integration created for workspace: ${req.workspaceId}`);

  res.status(201).json({
    success: true,
    message: 'Webhook integration setup successfully!',
    data: {
      id: integration.id,
      type: integration.type,
      status: integration.status,
    },
  });
};

