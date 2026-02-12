import { prisma } from '../config/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Get current workspace
 */
export const getCurrentWorkspace = async (req, res) => {
    const workspace = await prisma.workspace.findUnique({
        where: { id: req.workspaceId },
        include: {
            users: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true,
                },
            },
            integrations: {
                select: {
                    id: true,
                    type: true,
                    provider: true,
                    status: true,
                },
            },
        },
    });

    if (!workspace) {
        throw new ApiError(404, 'Workspace not found');
    }

    res.json({
        success: true,
        data: workspace,
    });
};

/**
 * Update workspace information
 */
export const updateWorkspace = async (req, res) => {
    const { businessName, contactEmail } = req.body;

    const workspace = await prisma.workspace.update({
        where: { id: req.workspaceId },
        data: {
            businessName,
            contactEmail,
        },
    });


    console.info(`Workspace updated: ${workspace.id}`);

    res.json({
        success: true,
        message: 'Workspace updated successfully',
        data: workspace,
    });
};

/**
 * Get onboarding status
 */
export const getOnboardingStatus = async (req, res) => {
    const workspace = await prisma.workspace.findUnique({
        where: { id: req.workspaceId },
    });

    // Check onboarding completion status
    const onboardingSteps = {
        emailSetup: workspace.emailSetup,
        smsSetup: workspace.smsSetup,
        contactFormSetup: workspace.contactFormSetup,
        bookingSetup: workspace.bookingSetup,
        formsSetup: workspace.formsSetup,
        inventorySetup: workspace.inventorySetup,
        staffSetup: workspace.staffSetup,
    };

    const completedSteps = Object.values(onboardingSteps).filter(Boolean).length;
    const totalSteps = Object.keys(onboardingSteps).length;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    // Check if ready to activate
    const requiredSteps = ['emailSetup', 'contactFormSetup', 'bookingSetup'];
    const canActivate = requiredSteps.every((step) => onboardingSteps[step]);

    res.json({
        success: true,
        data: {
            steps: onboardingSteps,
            progress,
            completedSteps,
            totalSteps,
            canActivate,
            status: workspace.status,
        },
    });
};

/**
 * Activate workspace (complete onboarding)
 */
export const activateWorkspace = async (req, res) => {
    const workspace = await prisma.workspace.findUnique({
        where: { id: req.workspaceId },
        include: {
            integrations: true,
            bookingTypes: true,
        },
    });

    // Verify required steps are completed
    if (!workspace.emailSetup && !workspace.smsSetup) {
        throw new ApiError(400, 'At least one communication channel (Email or SMS) must be configured');
    }

    if (!workspace.contactFormSetup) {
        throw new ApiError(400, 'Contact form must be configured');
    }

    if (!workspace.bookingSetup || workspace.bookingTypes.length === 0) {
        throw new ApiError(400, 'At least one booking type must be created');
    }

    // Check if at least one integration is connected
    const hasActiveIntegration = workspace.integrations.some(
        (integration) => integration.status === 'CONNECTED'
    );

    if (!hasActiveIntegration) {
        throw new ApiError(400, 'At least one integration must be connected');
    }

    // Activate workspace
    const updatedWorkspace = await prisma.workspace.update({
        where: { id: req.workspaceId },
        data: { status: 'ACTIVE' },
    });

    console.info(`Workspace activated: ${updatedWorkspace.id}`);

    res.json({
        success: true,
        message: 'Workspace activated successfully! Your business is now operational.',
        data: updatedWorkspace,
    });
};

/**
 * Get workspace statistics
 */
export const getWorkspaceStats = async (req, res) => {
    const [
        totalContacts,
        totalBookings,
        totalForms,
        totalInventoryItems,
        activeAlerts,
    ] = await Promise.all([
        prisma.contact.count({ where: { workspaceId: req.workspaceId } }),
        prisma.booking.count({ where: { workspaceId: req.workspaceId } }),
        prisma.form.count({ where: { workspaceId: req.workspaceId } }),
        prisma.inventoryItem.count({ where: { workspaceId: req.workspaceId } }),
        prisma.alert.count({
            where: {
                workspaceId: req.workspaceId,
                status: 'ACTIVE',
            },
        }),
    ]);

    res.json({
        success: true,
        data: {
            totalContacts,
            totalBookings,
            totalForms,
            totalInventoryItems,
            activeAlerts,
        },
    });
};