import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import aiService from '../services/ai.service.js';

/**
 * Chat with AI assistant
 */
export const chatWithAI = async (req, res) => {
  const { message, workspaceId, conversationHistory = [] } = req.body;

  // Get workspace info for context
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      bookingTypes: {
        where: { isActive: true },
        select: { name: true, description: true },
      },
    },
  });

  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  const businessContext = {
    businessName: workspace.businessName,
    services: workspace.bookingTypes.map(bt => bt.name).join(', '),
    location: workspace.address ? `${workspace.address}, ${workspace.city}` : null,
  };

  // Generate AI response
  const aiResponse = await aiService.generateCustomerResponse(message, businessContext);

  // Optionally analyze sentiment
  const sentiment = await aiService.analyzeSentiment(message);

  // Extract booking intent
  const intent = await aiService.extractBookingIntent(message);

  res.json({
    success: true,
    data: {
      response: aiResponse,
      sentiment,
      bookingIntent: intent,
    },
  });
};

/**
 * Suggest reply for staff
 */
export const suggestReply = async (req, res) => {
  const { conversationId } = req.body;

  // Get conversation with messages
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 10, // Last 10 messages
      },
      workspace: true,
    },
  });

  if (!conversation || conversation.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Conversation not found');
  }

  // Format conversation history
  const history = conversation.messages
    .map(m => `${m.direction === 'INBOUND' ? 'Customer' : 'Staff'}: ${m.body}`)
    .join('\n');

  const context = {
    businessName: conversation.workspace.businessName,
    customerName: conversation.contact.firstName || 'Customer',
  };

  const suggestion = await aiService.suggestReply(history, context);

  res.json({
    success: true,
    data: {
      suggestedReply: suggestion,
    },
  });
};

/**
 * Analyze sentiment
 */
export const analyzeSentiment = async (req, res) => {
  const { text } = req.body;

  const sentiment = await aiService.analyzeSentiment(text);

  res.json({
    success: true,
    data: { sentiment },
  });
};

/**
 * Extract booking intent
 */
export const extractIntent = async (req, res) => {
  const { message } = req.body;

  const intent = await aiService.extractBookingIntent(message);

  res.json({
    success: true,
    data: intent,
  });
};

/**
 * Generate form questions
 */
export const generateFormQuestions = async (req, res) => {
  const { description, numberOfQuestions = 5 } = req.body;

  const questions = await aiService.generateFormQuestions(description, numberOfQuestions);

  res.json({
    success: true,
    data: questions,
  });
};

/**
 * Summarize conversation
 */
export const summarizeConversation = async (req, res) => {
  const { conversationId } = req.body;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!conversation || conversation.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Conversation not found');
  }

  const messages = conversation.messages.map(m => ({
    sender: m.direction === 'INBOUND' ? 'Customer' : 'Staff',
    text: m.body,
  }));

  const summary = await aiService.summarizeConversation(messages);

  res.json({
    success: true,
    data: { summary },
  });
};

/**
 * Recommend booking slot
 */
export const recommendBookingSlot = async (req, res) => {
  const { preferences, availableSlots } = req.body;

  const recommendation = await aiService.recommendBookingTime(preferences, availableSlots);

  res.json({
    success: true,
    data: recommendation,
  });
};