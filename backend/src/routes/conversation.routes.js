import express from 'express';
import {
  getConversations,
  getConversationById,
  sendMessage,
  updateConversationStatus,
} from '../controllers/conversation.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getConversations);
router.get('/:id', getConversationById);
router.post('/:id/messages', sendMessage);
router.put('/:id/status', updateConversationStatus);

export default router;
