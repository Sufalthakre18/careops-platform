import { prisma } from '../config/prisma.js';
import emailService from './email.service.js';
import { emitToWorkspace } from '../server.js';

/**
 * Execute automation rule
 */
export const executeAutomation = async (trigger, data) => {
    try {
        // Find active automation rules for this trigger
        const rules = await prisma.automationRule.findMany({
            where: {
                workspaceId: data.workspaceId,
                trigger,
                isActive: true,
            },
        });

        console.info(`Found ${rules.length} automation rules for trigger: ${trigger}`);

        // Execute each rule
        for (const rule of rules) {
            try {
                await executeRule(rule, data);

                // Update execution tracking
                await prisma.automationRule.update({
                    where: { id: rule.id },
                    data: {
                        lastExecutedAt: new Date(),
                        executionCount: { increment: 1 },
                    },
                });
            } catch (error) {
                console.error(`Error executing automation rule ${rule.id}:`, error);
            }
        }
    } catch (error) {
        console.error('Error in executeAutomation:', error);
    }
};

/**
 * Execute individual automation rule
 */
const executeRule = async (rule, data) => {
    switch (rule.action) {
        case 'SEND_EMAIL':
            await executeSendEmail(rule, data);
            break;
        case 'SEND_SMS':
            await executeSendSMS(rule, data);
            break;
        case 'CREATE_ALERT':
            await executeCreateAlert(rule, data);
            break;
        case 'UPDATE_STATUS':
            await executeUpdateStatus(rule, data);
            break;
        default:
            console.warn(`Unknown automation action: ${rule.action}`);
    }
};

/**
 * Execute SEND_EMAIL action
 */
const executeSendEmail = async (rule, data) => {
    const { template, subject } = rule.config;
    const workspace = await prisma.workspace.findUnique({
        where: { id: data.workspaceId },
    });

    let recipient;
    emailSubject = emailSubject.replace('{{businessName}}', workspace.businessName);
    let emailBody = template;

    // Replace placeholders in template
    if (data.contact) {
        recipient = data.contact.email;
        if (!recipient) {
            console.warn('No email recipient found for automation rule:', rule.id);
            return;
        }

        emailBody = emailBody
            .replace('{{firstName}}', data.contact.firstName || '')
            .replace('{{lastName}}', data.contact.lastName || '')
            .replace('{{email}}', data.contact.email || '');
    }

    if (data.booking) {
        emailBody = emailBody
            .replace('{{bookingDate}}', new Date(data.booking.scheduledAt).toLocaleDateString())
            .replace('{{bookingTime}}', new Date(data.booking.scheduledAt).toLocaleTimeString())
            .replace('{{serviceName}}', data.booking.bookingType?.name || '');
    }

    emailBody = emailBody.replace('{{businessName}}', workspace.businessName);

    await emailService.sendEmail({
        to: recipient,
        subject: emailSubject,
        html: emailBody,
    });

    console.info(`Automated email sent to ${recipient}`);
};

/**
 * Execute SEND_SMS action (if SMS integration is configured)
 */
const executeSendSMS = async (rule, data) => {
    // TODO: Implement SMS sending logic when Twilio is integrated
    console.info('SMS automation triggered (not yet implemented)');
};

/**
 * Execute CREATE_ALERT action
 */
const executeCreateAlert = async (rule, data) => {
    const { alertType, priority, title, message } = rule.config;

    const alert = await prisma.alert.create({
        data: {
            workspaceId: data.workspaceId,
            type: alertType,
            priority: priority || 'MEDIUM',
            status: 'ACTIVE',
            title,
            message,
            entityType: data.entityType,
            entityId: data.entityId,
        },
    });

    // Emit real-time alert
    emitToWorkspace(data.workspaceId, 'alert:created', alert);

    console.info(`Alert created: ${title}`);
};

/**
 * Execute UPDATE_STATUS action
 */
const executeUpdateStatus = async (rule, data) => {
    const { entityType, status } = rule.config;

    if (entityType === 'contact' && data.contactId) {
        await prisma.contact.update({
            where: { id: data.contactId },
            data: { status },
        });
    }

    console.info(`Status updated for ${entityType}: ${data.entityId}`);
};

/**
 * Trigger: NEW_CONTACT
 */
export const triggerNewContact = async (contact, workspace) => {
    await executeAutomation('NEW_CONTACT', {
        workspaceId: workspace.id,
        contact,
        contactId: contact.id,
        entityType: 'contact',
        entityId: contact.id,
    });
};

/**
 * Trigger: BOOKING_CREATED
 */
export const triggerBookingCreated = async (booking, workspace) => {
    await executeAutomation('BOOKING_CREATED', {
        workspaceId: workspace.id,
        booking,
        contact: booking.contact,
        contactId: booking.contactId,
        bookingId: booking.id,
        entityType: 'booking',
        entityId: booking.id,
    });
};

/**
 * Trigger: FORM_PENDING
 */
export const triggerFormPending = async (formSubmission, contact, workspace) => {
    await executeAutomation('FORM_PENDING', {
        workspaceId: workspace.id,
        formSubmission,
        contact,
        contactId: contact.id,
        entityType: 'form_submission',
        entityId: formSubmission.id,
    });
};

/**
 * Trigger: FORM_OVERDUE
 */
export const triggerFormOverdue = async (formSubmission, contact, workspace) => {
    await executeAutomation('FORM_OVERDUE', {
        workspaceId: workspace.id,
        formSubmission,
        contact,
        contactId: contact.id,
        entityType: 'form_submission',
        entityId: formSubmission.id,
    });
};

/**
 * Trigger: INVENTORY_LOW
 */
export const triggerInventoryLow = async (inventoryItem, workspace) => {
    await executeAutomation('INVENTORY_LOW', {
        workspaceId: workspace.id,
        inventoryItem,
        entityType: 'inventory_item',
        entityId: inventoryItem.id,
    });
};

/**
 * Create default automation rules for new workspace
 */
export const createDefaultAutomationRules = async (workspaceId) => {
    const defaultRules = [
        {
            workspaceId,
            name: 'Welcome Email for New Contacts',
            description: 'Send welcome email when a new contact is created',
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
            isActive: true,
        },
        {
            workspaceId,
            name: 'Booking Confirmation',
            description: 'Send confirmation email when a booking is created',
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
            isActive: true,
        },
        {
            workspaceId,
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
            isActive: true,
        },
    ];

    await prisma.automationRule.createMany({
        data: defaultRules,
    });


    console.info(`Created ${defaultRules.length} default automation rules for workspace ${workspaceId}`);
};

export default {
    executeAutomation,
    triggerNewContact,
    triggerBookingCreated,
    triggerFormPending,
    triggerFormOverdue,
    triggerInventoryLow,
    createDefaultAutomationRules,
};