import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { emitToWorkspace } from '../server.js';
import emailService from '../services/email.service.js';

/**
 * Get all conversations for workspace
 */
export const getConversations = async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: { workspaceId: req.workspaceId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      contact: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  res.json({
    success: true,
    data: conversations,
  });
};

/**
 * Get single conversation by ID
 */
export const getConversationById = async (req, res) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      contact: true,
    },
  });

  if (!conversation || conversation.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Conversation not found');
  }

  res.json({
    success: true,
    data: conversation,
  });
};

/**
 * Send message in conversation
 */
export const sendMessage = async (req, res) => {
  const { body, channel, direction, sender, recipient, subject } = req.body;

  if (!body || !channel || !direction) {
    throw new ApiError(400, 'Missing required fields: body, channel, direction');
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.id },
    include: { contact: true },
  });

  if (!conversation || conversation.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Conversation not found');
  }

  // Get workspace info
  const workspace = await prisma.workspace.findUnique({
    where: { id: conversation.workspaceId },
  });

  // 1. Create the message
  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      body,
      channel,
      direction,
      sender,
      recipient,
      subject,
      isAutomated: false,
      isRead: false,
    },
  });

  // 2. Update conversation's lastMessageAt
  const updatedConversation = await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
    include: { messages: { orderBy: { createdAt: 'asc' } }, contact: true },
  });

  // 3. Send email if direction is OUTBOUND and channel is EMAIL
  if (direction === 'OUTBOUND' && channel === 'EMAIL') {
    try {
      await emailService.sendMessageNotification(message, conversation.contact, workspace);
      console.log('✅ Email sent to:', conversation.contact.email);
    } catch (error) {
      console.error('❌ Email failed:', error.message);
      // Don't fail the request if email fails
    }
  }

  // 4. Emit real-time event to workspace
  emitToWorkspace(conversation.workspaceId, 'new-message', {
    conversationId: conversation.id,
    message,
  });

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: updatedConversation,
  });
};

/**
 * Update conversation status
 */
export const updateConversationStatus = async (req, res) => {
  const { status } = req.body; // OPEN, PENDING, CLOSED

  if (!status) {
    throw new ApiError(400, 'Missing status field');
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.id },
  });

  if (!conversation || conversation.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Conversation not found');
  }

  const updatedConversation = await prisma.conversation.update({
    where: { id: req.params.id },
    data: { status },
    include: { messages: { orderBy: { createdAt: 'asc' } }, contact: true },
  });

  // Emit real-time event for status change
  emitToWorkspace(conversation.workspaceId, 'conversation-updated', {
    conversationId: conversation.id,
    status,
  });

  res.json({
    success: true,
    message: 'Conversation status updated successfully',
    data: updatedConversation,
  });
};