import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as aiController from '../controllers/ai.controller.js';

const router = express.Router();

/**
 * @route   POST /api/ai/chat
 * @desc    AI chatbot for customer support
 * @access  Public
 */
router.post(
  '/chat',
  [
    body('message').notEmpty().withMessage('Message is required'),
    body('workspaceId').isUUID().withMessage('Valid workspace ID required'),
    body('conversationHistory').optional().isArray(),
    validate,
  ],
  asyncHandler(aiController.chatWithAI)
);

/**
 * @route   POST /api/ai/suggest-reply
 * @desc    Get AI-suggested reply for staff
 * @access  Private
 */
router.post(
  '/suggest-reply',
  authenticate,
  [
    body('conversationId').isUUID(),
    validate,
  ],
  asyncHandler(aiController.suggestReply)
);

/**
 * @route   POST /api/ai/analyze-sentiment
 * @desc    Analyze message sentiment
 * @access  Private
 */
router.post(
  '/analyze-sentiment',
  authenticate,
  [
    body('text').notEmpty(),
    validate,
  ],
  asyncHandler(aiController.analyzeSentiment)
);

/**
 * @route   POST /api/ai/extract-intent
 * @desc    Extract booking intent from message
 * @access  Private
 */
router.post(
  '/extract-intent',
  authenticate,
  [
    body('message').notEmpty(),
    validate,
  ],
  asyncHandler(aiController.extractIntent)
);

/**
 * @route   POST /api/ai/generate-form
 * @desc    Generate form questions using AI
 * @access  Private
 */
router.post(
  '/generate-form',
  authenticate,
  [
    body('description').notEmpty(),
    body('numberOfQuestions').optional().isInt({ min: 3, max: 10 }),
    validate,
  ],
  asyncHandler(aiController.generateFormQuestions)
);

/**
 * @route   POST /api/ai/summarize-conversation
 * @desc    Summarize a conversation
 * @access  Private
 */
router.post(
  '/summarize-conversation',
  authenticate,
  [
    body('conversationId').isUUID(),
    validate,
  ],
  asyncHandler(aiController.summarizeConversation)
);

/**
 * @route   POST /api/ai/recommend-slot
 * @desc    Recommend best booking slot
 * @access  Public
 */
router.post(
  '/recommend-slot',
  [
    body('preferences').notEmpty(),
    body('availableSlots').isArray(),
    validate,
  ],
  asyncHandler(aiController.recommendBookingSlot)
);

export default router;