import { prisma } from '../config/prisma.js';
import { emitToWorkspace } from '../server.js';
import { ApiError } from '../middleware/errorHandler.js';
import { paginate, paginationMeta } from '../utils/helpers.js';

/**
 * Create new form
 */
export const createForm = async (req, res) => {
  const { name, description, type, config, externalUrl, externalProvider } = req.body;

  if (!name || !type) {
    throw new ApiError(400, 'Name and type are required');
  }

  const form = await prisma.form.create({
    data: {
      workspaceId: req.workspaceId,
      name,
      description,
      type,
      config,
      externalUrl,
      externalProvider,
      isActive: true,
    },
  });

  await prisma.workspace.update({
    where: { id: req.workspaceId },
    data: { formsSetup: true },
  });

  console.info(`Form created: ${form.id}`);

  res.status(201).json({
    success: true,
    message: 'Form created successfully',
    data: form,
  });
};

/**
 * Get all forms
 */
export const getForms = async (req, res) => {
  const forms = await prisma.form.findMany({
    where: {
      workspaceId: req.workspaceId,
      isActive: true,
    },
    include: {
      bookingTypes: {
        include: {
          bookingType: true,
        },
      },
      submissions: {
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: forms,
  });
};

/**
 * Get form by ID
 */
export const getFormById = async (req, res) => {
  const form = await prisma.form.findUnique({
    where: { id: req.params.id },
    include: {
      bookingTypes: {
        include: {
          bookingType: true,
        },
      },
      submissions: {
        include: {
          contact: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!form || form.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Form not found');
  }

  res.json({
    success: true,
    data: form,
  });
};

/**
 * Update form
 */
export const updateForm = async (req, res) => {
  const existing = await prisma.form.findUnique({
    where: { id: req.params.id },
  });

  if (!existing || existing.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Form not found');
  }

  const updatedForm = await prisma.form.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json({
    success: true,
    message: 'Form updated successfully',
    data: updatedForm,
  });
};

/**
 * Soft delete form
 */
export const deleteForm = async (req, res) => {
  const existing = await prisma.form.findUnique({
    where: { id: req.params.id },
  });

  if (!existing || existing.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Form not found');
  }

  await prisma.form.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({
    success: true,
    message: 'Form deleted successfully',
  });
};

/**
 * Link form to booking type
 */
export const linkFormToBookingType = async (req, res) => {
  const { formId, bookingTypeId } = req.params;
  const { sendAfterBooking = true, reminderAfterDays } = req.body;

  const form = await prisma.form.findUnique({
    where: { id: formId },
  });

  if (!form || form.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Form not found');
  }

  const bookingType = await prisma.bookingType.findUnique({
    where: { id: bookingTypeId },
  });

  if (!bookingType || bookingType.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Booking type not found');
  }

  const link = await prisma.bookingTypeForm.upsert({
    where: {
      bookingTypeId_formId: {
        bookingTypeId,
        formId,
      },
    },
    create: {
      bookingTypeId,
      formId,
      sendAfterBooking,
      reminderAfterDays,
    },
    update: {
      sendAfterBooking,
      reminderAfterDays,
    },
    include: {
      form: true,
      bookingType: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Form linked successfully',
    data: link,
  });
};

/**
 * Get all form submissions (workspace protected)
 */
export const getFormSubmissions = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {
    workspaceId: req.workspaceId,
    ...(status && { status }),
  };

  const [submissions, total] = await Promise.all([
    prisma.formSubmission.findMany({
      where,
      include: {
        form: true,
        contact: true,
        booking: {
          include: {
            bookingType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.formSubmission.count({ where }),
  ]);

  res.json({
    success: true,
    data: submissions,
    meta: paginationMeta(total, parseInt(page), parseInt(limit)),
  });
};

/**
 * Get form submission by ID (public safe version)
 */
export const getFormSubmissionById = async (req, res) => {
  const submission = await prisma.formSubmission.findUnique({
    where: { id: req.params.id },
    include: {
      form: true,
    },
  });

  if (!submission) {
    throw new ApiError(404, 'Form submission not found');
  }

  // Do NOT expose contact/workspace in public endpoint
  res.json({
    success: true,
    data: submission,
  });
};

/**
 * Submit form data (public endpoint)
 */
export const submitForm = async (req, res) => {
  const { data } = req.body;
  const { id } = req.params;

  if (!data) {
    throw new ApiError(400, 'Form data is required');
  }

  const submission = await prisma.formSubmission.findUnique({
    where: { id },
  });

  if (!submission) {
    throw new ApiError(404, 'Form submission not found');
  }

  if (submission.status === 'COMPLETED') {
    throw new ApiError(400, 'Form has already been submitted');
  }

  const updatedSubmission = await prisma.formSubmission.update({
    where: { id },
    data: {
      data,
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  emitToWorkspace(submission.workspaceId, 'form:completed', updatedSubmission);

  console.info(`Form submitted: ${id}`);

  res.json({
    success: true,
    message: 'Form submitted successfully. Thank you!',
    data: updatedSubmission,
  });
};
