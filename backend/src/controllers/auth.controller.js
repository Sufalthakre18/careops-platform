import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { generateToken, hashPassword, comparePassword } from '../utils/helpers.js';
import automationService from '../services/automation.service.js';


//Register new business owner

export const register = async (req, res) => {
    const { email, password, firstName, lastName, businessName, contactEmail } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new ApiError(409, 'User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and workspace in a transaction
    const result = await prisma.$transaction(async (tx) => {
        // Create workspace
        const workspace = await tx.workspace.create({
            data: {
                businessName,
                contactEmail,
                status: 'SETUP',
            },
        });

        // Create user
        const user = await tx.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: 'OWNER',
                status: 'ACTIVE',
                workspaceId: workspace.id,
            },
            include: {
                workspace: true,
            },
        });

        return { user, workspace };
    });

    // Create default automation rules
    await automationService.createDefaultAutomationRules(result.workspace.id);

    // Generate token
    const token = generateToken(result.user.id);

    console.info(`New user registered: ${email}`);

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
            user: {
                id: result.user.id,
                email: result.user.email,
                firstName: result.user.firstName,
                lastName: result.user.lastName,
                role: result.user.role,
                workspace: result.user.workspace,
            },
            token,
        },
    });
};

/**
 * Login user
 */
export const login = async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            workspace: true,
            permissions: true,
        },
    });

    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
        throw new ApiError(401, 'Your account is not active');
    }

    // Generate token
    const token = generateToken(user.id);

    console.info(`User logged in: ${email}`);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: userWithoutPassword,
            token,
        },
    });
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            workspace: true,
            permissions: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.json({
        success: true,
        data: user,
    });
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
    const { firstName, lastName } = req.body;

    const user = await prisma.user.update({
        where: { id: req.userId },
        data: {
            firstName,
            lastName,
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
        },
    });

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
    });
};

/**
 * Change password
 */
export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
        where: { id: req.userId },
    });

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
        where: { id: req.userId },
        data: { password: hashedPassword },
    });

    console.info(`Password changed for user: ${user.email}`);

    res.json({
        success: true,
        message: 'Password changed successfully',
    });
};