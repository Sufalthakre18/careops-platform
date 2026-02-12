import express from 'express';
import { body, query } from 'express-validator';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as contactController from '../controllers/contact.controller.js';

const contactRouter = express.Router();

// Create contact (public endpoint for forms)
contactRouter.post(
  '/',
  [
    body('workspaceId').isUUID(),
    body('email').isEmail(),
    body('firstName').optional(),
    body('lastName').optional(),
    body('phone').optional(),
    body('message').optional(),
    validate,
  ],
  asyncHandler(contactController.createContact)
);

// Get all contacts
contactRouter.get(
  '/',
  authenticate,
  requirePermission('canManageContacts'),
  [query('page').optional().isInt(), query('limit').optional().isInt(), validate],
  asyncHandler(contactController.getContacts)
);

// Get contact by ID
contactRouter.get(
  '/:id',
  authenticate,
  asyncHandler(contactController.getContactById)
);

// Update contact
contactRouter.put(
  '/:id',
  authenticate,
  requirePermission('canManageContacts'),
  asyncHandler(contactController.updateContact)
);

export default contactRouter;

// tested all apis