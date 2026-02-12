import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { hashPassword, generateRandomString } from '../utils/helpers.js';
import emailService from '../services/email.service.js';

/**
 * Invite staff member
 */
export const inviteStaff = async (req, res) => {
  const { email, firstName, lastName, permissions } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  const tempPassword = generateRandomString(16);
  const hashedPassword = await hashPassword(tempPassword);

  const staff = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'STAFF',
      status: 'PENDING',
      workspaceId: req.workspaceId,
      permissions: {
        create:
          permissions || {
            canAccessInbox: true,
            canManageBookings: true,
            canViewForms: true,
            canManageForms: false,
            canViewInventory: true,
            canManageInventory: false,
            canManageContacts: true,
          },
      },
    },
    include: {
      permissions: true,
    },
  });

  await prisma.workspace.update({
    where: { id: req.workspaceId },
    data: { staffSetup: true },
  });

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.workspaceId },
      select: { businessName: true },
    });

    await emailService.sendEmail({
      to: email,
      subject: `You've been invited to join ${workspace.businessName}`,
      html: `
        <h1>Welcome to ${workspace.businessName}!</h1>
        <p>You’ve been invited to join the team as a staff member.</p>
        <p><strong>Your temporary credentials:</strong></p>
        <p>Email: ${email}<br>Password: ${tempPassword}</p>
        <p>Please log in and change your password immediately.</p>
        <p>Login URL: ${process.env.FRONTEND_URL}/login</p>
      `,
    });
  } catch (error) {
    console.error('Error sending staff invitation email:', error);
  }

  console.info(`Staff member invited: ${staff.id}`);

  res.status(201).json({
    success: true,
    message: 'Staff member invited successfully.',
    data: {
      id: staff.id,
      email: staff.email,
      firstName: staff.firstName,
      lastName: staff.lastName,
      role: staff.role,
      status: staff.status,
      permissions: staff.permissions,
    },
  });
};


/**
 * Get all staff members
 */
export const getStaff = async (req, res) => {
  const staff = await prisma.user.findMany({
    where: {
      workspaceId: req.workspaceId,
      role: 'STAFF',
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      permissions: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({
    success: true,
    data: staff,
  });
};


/**
 * Get staff member by ID
 */
export const getStaffById = async (req, res) => {
  const staff = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      workspaceId: true,
      createdAt: true,
      updatedAt: true,
      permissions: true,
    },
  });

  if (!staff || staff.workspaceId !== req.workspaceId || staff.role !== 'STAFF') {
    throw new ApiError(404, 'Staff member not found');
  }

  res.json({
    success: true,
    data: staff,
  });
};


/**
 * Update staff member
 */
export const updateStaff = async (req, res) => {
  const { firstName, lastName, status } = req.body;

  const staff = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (!staff || staff.workspaceId !== req.workspaceId || staff.role !== 'STAFF') {
    throw new ApiError(404, 'Staff member not found');
  }

  const updatedStaff = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      firstName,
      lastName,
      status,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    success: true,
    message: 'Staff member updated successfully',
    data: updatedStaff,
  });
};

/**
 * Update staff permissions
 */
export const updatePermissions = async (req, res) => {
  const permissionUpdates = req.body;

  const staff = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { permissions: true },
  });

  if (!staff || staff.workspaceId !== req.workspaceId || staff.role !== 'STAFF') {
    throw new ApiError(404, 'Staff member not found');
  }

  const permissions = await prisma.staffPermission.upsert({
    where: { userId: req.params.id },
    create: {
      userId: req.params.id,
      ...permissionUpdates,
    },
    update: permissionUpdates,
  });

  console.info(`Permissions updated for staff: ${req.params.id}`);

  res.json({
    success: true,
    message: 'Permissions updated successfully',
    data: permissions,
  });
};

/**
 * Activate staff member
 */
export const activateStaff = async (req, res) => {
  const staff = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (!staff || staff.workspaceId !== req.workspaceId || staff.role !== 'STAFF') {
    throw new ApiError(404, 'Staff member not found');
  }

  const updatedStaff = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: 'ACTIVE' },
  });

  res.json({
    success: true,
    message: 'Staff member activated successfully',
    data: {
      id: updatedStaff.id,
      status: updatedStaff.status,
    },
  });
};

/**
 * Deactivate staff member
 */
export const deactivateStaff = async (req, res) => {
  const staff = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (!staff || staff.workspaceId !== req.workspaceId || staff.role !== 'STAFF') {
    throw new ApiError(404, 'Staff member not found');
  }

  const updatedStaff = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: 'INACTIVE' },
  });

  res.json({
    success: true,
    message: 'Staff member deactivated successfully',
    data: {
      id: updatedStaff.id,
      status: updatedStaff.status,
    },
  });
};

/**
 * Remove staff member
 */
export const removeStaff = async (req, res) => {
  const staff = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (!staff || staff.workspaceId !== req.workspaceId || staff.role !== 'STAFF') {
    throw new ApiError(404, 'Staff member not found');
  }

  await prisma.user.delete({
    where: { id: req.params.id },
  });

  console.info(`Staff member removed: ${req.params.id}`);

  res.json({
    success: true,
    message: 'Staff member removed successfully',
  });
};

/**
 * Reset staff password
 */
export const resetPassword = async (req, res) => {
  const staff = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (!staff || staff.workspaceId !== req.workspaceId || staff.role !== 'STAFF') {
    throw new ApiError(404, 'Staff member not found');
  }

  const newPassword = generateRandomString(16);
  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: req.params.id },
    data: {
      password: hashedPassword,
      status: 'PENDING',
    },
  });

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.workspaceId },
      select: { businessName: true },
    });

    await emailService.sendEmail({
      to: staff.email,
      subject: 'Your password has been reset',
      html: `
        <h1>Password Reset</h1>
        <p>Your password for ${workspace.businessName} has been reset.</p>
        <p><strong>Your new temporary password:</strong></p>
        <p>${newPassword}</p>
        <p>Please log in and change your password immediately.</p>
        <p>Login URL: ${process.env.FRONTEND_URL}/login</p>
      `,
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }

  console.info(`Password reset for staff: ${req.params.id}`);

  res.json({
    success: true,
    message: 'Password reset successfully. New password sent to staff email.',
  });
};
