import { prisma } from '../config/prisma.js';
import { emitToWorkspace } from '../server.js';
import { ApiError } from '../middleware/errorHandler.js';
import { paginate, paginationMeta } from '../utils/helpers.js';
import automationService from '../services/automation.service.js';

/**
 * Create contact (public endpoint for contact forms)
 */
export const createContact = async (req, res) => {
  const { workspaceId, email, firstName, lastName, phone, message } = req.body;

  // Basic validation
  if (!workspaceId || !email) {
    throw new ApiError(400, 'Workspace ID and email are required');
  }

  // Verify workspace is active
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace || workspace.status !== 'ACTIVE') {
    throw new ApiError(400, 'Workspace is not active');
  }

  // Check if contact already exists
  let contact = await prisma.contact.findFirst({
    where: {
      workspaceId,
      email,
    },
  });

  if (contact) {
    // Update existing contact safely
    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        firstName: firstName ?? contact.firstName,
        lastName: lastName ?? contact.lastName,
        phone: phone ?? contact.phone,
      },
    });
  } else {
    // Create new contact
    contact = await prisma.contact.create({
      data: {
        workspaceId,
        email,
        firstName,
        lastName,
        phone,
        source: 'CONTACT_FORM',
        status: 'NEW',
      },
    });
  }

  // Find or create OPEN conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      workspaceId,
      contactId: contact.id,
      status: 'OPEN',
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        workspaceId,
        contactId: contact.id,
        subject: 'New Inquiry',
        status: 'OPEN',
      },
    });
  }

  // Create message if provided
  if (message) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        channel: 'EMAIL',
        direction: 'INBOUND',
        body: message,
        sender: email,
        recipient: workspace.contactEmail,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });
  }

  // Trigger automation
  await automationService.triggerNewContact(contact, workspace);

  // Emit real-time event
  emitToWorkspace(workspaceId, 'contact:created', contact);

  // Update onboarding status
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { contactFormSetup: true },
  });

  console.info(`Contact created: ${contact.id}`);

  res.status(201).json({
    success: true,
    message: 'Thank you for contacting us! We will get back to you shortly.',
    data: contact,
  });
};

export const createContactAdmin = async (req, res) => {
  const { email, firstName, lastName, phone } = req.body;

  const contact = await prisma.contact.create({
    data: {
      workspaceId: req.workspaceId,
      email,
      firstName,
      lastName,
      phone,
      status: 'NEW',
    },
  });

  // ✅ CREATE CONVERSATION (was missing!)
  const conversation = await prisma.conversation.create({
    data: {
      workspaceId: req.workspaceId,
      contactId: contact.id,
      subject: 'New Contact',
      status: 'OPEN',
    },
  });

  // ✅ Set contactFormSetup flag
  await prisma.workspace.update({
    where: { id: req.workspaceId },
    data: { contactFormSetup: true },
  });

  res.status(201).json({
    success: true,
    message: 'Contact created successfully',
    data: contact,
  });
};

/**
 * Get all contacts
 */
export const getContacts = async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {
    workspaceId: req.workspaceId,
    ...(status && { status }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        conversations: {
          take: 1,
          orderBy: { lastMessageAt: 'desc' },
        },
        bookings: {
          take: 1,
          orderBy: { scheduledAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.contact.count({ where }),
  ]);

  res.json({
    success: true,
    data: contacts,
    meta: paginationMeta(total, parseInt(page), parseInt(limit)),
  });
};

/**
 * Get contact by ID
 */
export const getContactById = async (req, res) => {
  const contact = await prisma.contact.findUnique({
    where: { id: req.params.id },
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
      bookings: {
        include: {
          bookingType: true,
        },
        orderBy: { scheduledAt: 'desc' },
      },
      formSubmissions: {
        include: {
          form: true,
        },
      },
    },
  });

  if (!contact || contact.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Contact not found');
  }

  res.json({
    success: true,
    data: contact,
  });
};

/**
 * Update contact
 */
export const updateContact = async (req, res) => {
  const { id } = req.params;

  // Check if contact exists and belongs to workspace
  const existingContact = await prisma.contact.findUnique({
    where: { id },
  });

  if (!existingContact || existingContact.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Contact not found');
  }

  // Whitelist only allowed fields
  const { firstName, lastName, email, phone, status } = req.body;

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(status !== undefined && { status }),
    },
  });

  res.json({
    success: true,
    message: 'Contact updated successfully',
    data: contact,
  });
};

/**
 * Delete contact
 */
export const deleteContact = async (req, res) => {
  const { id } = req.params;

  // Check if contact exists and belongs to workspace
  const existingContact = await prisma.contact.findUnique({
    where: { id },
  });

  if (!existingContact || existingContact.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Contact not found');
  }

  // Delete related data first (important if no cascade in schema)
  await prisma.$transaction([
    prisma.message.deleteMany({
      where: {
        conversation: {
          contactId: id,
        },
      },
    }),
    prisma.conversation.deleteMany({
      where: { contactId: id },
    }),
    prisma.booking.deleteMany({
      where: { contactId: id },
    }),
    prisma.formSubmission.deleteMany({
      where: { contactId: id },
    }),
    prisma.contact.delete({
      where: { id },
    }),
  ]);

  res.json({
    success: true,
    message: 'Contact deleted successfully',
  });
};
