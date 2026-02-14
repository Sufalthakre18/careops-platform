import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { emitToWorkspace } from '../server.js';
import { paginate, paginationMeta, generateTimeSlots, timeStringToMinutes } from '../utils/helpers.js';
import emailService from '../services/email.service.js';
import automationService from '../services/automation.service.js';

// ==========================================
// BOOKING TYPES
// ==========================================

/**
 * Create booking type
 */
export const createBookingType = async (req, res) => {
  const { name, description, duration, location, price, currency } = req.body;

  const bookingType = await prisma.bookingType.create({
    data: {
      workspaceId: req.workspaceId,
      name,
      description,
      duration,
      location,
      price,
      currency,
    },
  });

  // Update workspace onboarding status
  await prisma.workspace.update({
    where: { id: req.workspaceId },
    data: { bookingSetup: true },
  });

  res.status(201).json({
    success: true,
    message: 'Booking type created successfully',
    data: bookingType,
  });
};

/**
 * Get all booking types
 */
export const getBookingTypes = async (req, res) => {
  const workspaceId = req.workspaceId || req.query.workspaceId;

  if (!workspaceId) {
    throw new ApiError(400, 'Workspace ID is required');
  }

  const bookingTypes = await prisma.bookingType.findMany({
    where: {
      workspaceId,
      isActive: true,
    },
    include: {
      availability: {
        where: { isActive: true },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: bookingTypes,
  });
};

/**
 * Get booking type by ID
 */
export const getBookingTypeById = async (req, res) => {
  const bookingType = await prisma.bookingType.findUnique({
    where: { id: req.params.id },
    include: {
      availability: {
        where: { isActive: true },
      },
      forms: {
        include: {
          form: true,
        },
      },
    },
  });

  if (!bookingType) {
    throw new ApiError(404, 'Booking type not found');
  }

  res.json({
    success: true,
    data: bookingType,
  });
};

/**
 * Update booking type
 */
export const updateBookingType = async (req, res) => {
  const updates = req.body;

  const bookingType = await prisma.bookingType.update({
    where: { id: req.params.id },
    data: updates,
  });

  res.json({
    success: true,
    message: 'Booking type updated successfully',
    data: bookingType,
  });
};

/**
 * Delete booking type
 */
export const deleteBookingType = async (req, res) => {
  await prisma.bookingType.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({
    success: true,
    message: 'Booking type deleted successfully',
  });
};

// ==========================================
// AVAILABILITY
// ==========================================

/**
 * Add availability to booking type
 */
export const addAvailability = async (req, res) => {
  const { id } = req.params;
  const { dayOfWeek, startTime, endTime } = req.body;

  // Validate time range
  if (timeStringToMinutes(startTime) >= timeStringToMinutes(endTime)) {
    throw new ApiError(400, 'End time must be after start time');
  }

  const availability = await prisma.bookingAvailability.create({
    data: {
      bookingTypeId: id,
      dayOfWeek,
      startTime,
      endTime,
    },
  });

 console.info(`Availability added for booking type: ${id}`);

  res.status(201).json({
    success: true,
    message: 'Availability added successfully',
    data: availability,
  });
};

/**
 * Get availability for booking type
 */
export const getAvailability = async (req, res) => {
  const availability = await prisma.bookingAvailability.findMany({
    where: {
      bookingTypeId: req.params.id,
      isActive: true,
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  res.json({
    success: true,
    data: availability,
  });
};

/**
 * Get available time slots for a specific date
 */
export const getAvailableSlots = async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  // Parse the requested date
  const requestedDate = new Date(date);
  const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][
    requestedDate.getDay()
  ];

  // Get booking type and availability
  const bookingType = await prisma.bookingType.findUnique({
    where: { id },
    include: {
      availability: {
        where: {
          dayOfWeek,
          isActive: true,
        },
      },
    },
  });

  if (!bookingType) {
    throw new ApiError(404, 'Booking type not found');
  }

  if (bookingType.availability.length === 0) {
    return res.json({
      success: true,
      data: {
        date,
        slots: [],
        message: 'No availability for this day',
      },
    });
  }

  // Get existing bookings for this date
  const startOfDay = new Date(requestedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(requestedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingBookings = await prisma.booking.findMany({
    where: {
      bookingTypeId: id,
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: ['PENDING', 'CONFIRMED'],
      },
    },
  });

  // Generate all possible slots and filter out booked ones
  const availableSlots = [];

  for (const avail of bookingType.availability) {
    const slots = generateTimeSlots(avail.startTime, avail.endTime, bookingType.duration);

    for (const slot of slots) {
      const [hours, minutes] = slot.split(':').map(Number);
      const slotDateTime = new Date(requestedDate);
      slotDateTime.setHours(hours, minutes, 0, 0);

      // Check if slot is in the past
      if (slotDateTime < new Date()) {
        continue;
      }

      // Check if slot conflicts with existing booking
      const hasConflict = existingBookings.some((booking) => {
        const bookingStart = new Date(booking.scheduledAt);
        const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);
        const slotEnd = new Date(slotDateTime.getTime() + bookingType.duration * 60000);

        return slotDateTime < bookingEnd && slotEnd > bookingStart;
      });

      if (!hasConflict) {
        availableSlots.push({
          time: slot,
          dateTime: slotDateTime.toISOString(),
        });
      }
    }
  }

  res.json({
    success: true,
    data: {
      date,
      slots: availableSlots,
    },
  });
};

/**
 * Delete availability
 */
export const deleteAvailability = async (req, res) => {
  await prisma.bookingAvailability.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({
    success: true,
    message: 'Availability deleted successfully',
  });
};

// ==========================================
// BOOKINGS
// ==========================================

/**
 * Create new booking (public endpoint)
 */
export const createBooking = async (req, res) => {
  const { workspaceId, bookingTypeId, scheduledAt, customerName, customerEmail, customerPhone, notes } = req.body;

  // Verify booking type exists
  const bookingType = await prisma.bookingType.findUnique({
    where: { id: bookingTypeId },
  });

  if (!bookingType || !bookingType.isActive) {
    throw new ApiError(404, 'Booking type not found or inactive');
  }

  // Verify workspace is active
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace || workspace.status !== 'ACTIVE') {
    throw new ApiError(400, 'Workspace is not active');
  }

  // Check if slot is still available
  const scheduledDate = new Date(scheduledAt);
  const slotEnd = new Date(scheduledDate.getTime() + bookingType.duration * 60000);

  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      bookingTypeId,
      scheduledAt: {
        lt: slotEnd,
      },
      status: {
        in: ['PENDING', 'CONFIRMED'],
      },
    },
  });

  if (conflictingBooking) {
    const conflictEnd = new Date(
      new Date(conflictingBooking.scheduledAt).getTime() + conflictingBooking.duration * 60000
    );
    if (conflictEnd > scheduledDate) {
      throw new ApiError(409, 'This time slot is no longer available');
    }
  }

  // Create or find contact
  let contact = await prisma.contact.findFirst({
    where: {
      workspaceId,
      email: customerEmail,
    },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        workspaceId,
        email: customerEmail,
        firstName: customerName.split(' ')[0],
        lastName: customerName.split(' ').slice(1).join(' '),
        phone: customerPhone,
        source: 'BOOKING_FORM',
        status: 'NEW',
      },
    });
  }

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      workspaceId,
      bookingTypeId,
      contactId: contact.id,
      scheduledAt: scheduledDate,
      duration: bookingType.duration,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      status: 'PENDING',
    },
    include: {
      bookingType: true,
      contact: true,
    },
  });

  // Send confirmation email
  try {
    await emailService.sendBookingConfirmation(booking, workspace);
  } catch (error) {
   console.error('Error sending booking confirmation:', error);
  }

  // Trigger automation
  await automationService.triggerBookingCreated(booking, workspace);

  // Send forms if configured
  const bookingTypeForms = await prisma.bookingTypeForm.findMany({
    where: { bookingTypeId },
    include: { form: true },
  });

  for (const btf of bookingTypeForms) {
    if (btf.sendAfterBooking) {
      const formSubmission = await prisma.formSubmission.create({
        data: {
          workspaceId,
          formId: btf.form.id,
          contactId: contact.id,
          bookingId: booking.id,
          status: 'PENDING',
        },
        include: {
          form: true,
        },
      });

      try {
        await emailService.sendFormRequest(formSubmission, contact, workspace);
      } catch (error) {
       console.error('Error sending form request:', error);
      }
    }
  }

  // Emit real-time event
  emitToWorkspace(workspaceId, 'booking:created', booking);

 console.info(`Booking created: ${booking.id}`);

  res.status(201).json({
    success: true,
    message: 'Booking created successfully! Confirmation sent to your email.',
    data: booking,
  });
};

/**
 * Get all bookings with filters
 */
export const getBookings = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const { skip, take } = paginate(page, limit);

  const where = {
    workspaceId: req.workspaceId,
    ...(status && { status }),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        bookingType: true,
        contact: true,
      },
      orderBy: { scheduledAt: 'desc' },
      skip,
      take,
    }),
    prisma.booking.count({ where }),
  ]);

  res.json({
    success: true,
    data: bookings,
    meta: paginationMeta(total, parseInt(page), parseInt(limit)),
  });
};

/**
 * Get booking by ID
 */
export const getBookingById = async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      bookingType: true,
      contact: true,
      formSubmissions: {
        include: {
          form: true,
        },
      },
    },
  });

  if (!booking || booking.workspaceId !== req.workspaceId) {
    throw new ApiError(404, 'Booking not found');
  }

  res.json({
    success: true,
    data: booking,
  });
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (req, res) => {
  const { status } = req.body;

  const booking = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status },
    include: {
      bookingType: true,
      contact: true,
    },
  });

  // Emit real-time event
  emitToWorkspace(booking.workspaceId, 'booking:updated', booking);

 console.info(`Booking status updated: ${booking.id} -> ${status}`);

  res.json({
    success: true,
    message: 'Booking status updated successfully',
    data: booking,
  });
};

/**
 * Cancel booking
 */
export const cancelBooking = async (req, res) => {
  const booking = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
  });

  // Emit real-time event
  emitToWorkspace(booking.workspaceId, 'booking:cancelled', booking);

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: booking,
  });
};