// Controller handlers for users.
import {
    adminResetPassword,
    checkBackofficeEmailAvailability,
    createGestionaleUser,
    deleteGestionaleUser,
    deleteMobileAppUser,
    disableMobileAppUser,
    getFilteredBackofficeUsers,
    getFilteredMobileAppUsers,
    suspendBackofficeUser,
    unsuspendBackofficeUser,
    updateGestionaleUserInfo,
    updateMobileAppUserInfo,
} from '../services/usersService.js';

// Sends known service errors back to the client.
function handleServiceError(res, next, error) {
    if (error?.status) {
        return res.status(error.status).json({ message: error.message });
    }

    return next(error);
}

// Returns the data used by filtered users mobile app.
export async function getFilteredUsersMobileApp(req, res, next) {
    try {
        const result = await getFilteredMobileAppUsers(req.query || {});
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Returns the data used by filtered users gestionale.
export async function getFilteredUsersGestionale(req, res, next) {
    try {
        const result = await getFilteredBackofficeUsers(req.query || {});
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Helper function used by reset password admin.
export async function resetPasswordAdmin(req, res, next) {
    try {
        const result = await adminResetPassword({
            targetUserId: req.params.id,
            newPassword: req.body?.newPassword,
        });
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Helper function used by suspend user.
export async function suspendUser(req, res, next) {
    try {
        const result = await suspendBackofficeUser({
            actingUserId: req.user?.id,
            targetUserId: req.params.id,
        });
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Helper function used by unsuspend user.
export async function unsuspendUser(req, res, next) {
    try {
        const result = await unsuspendBackofficeUser(req.params.id);
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Deletes the data for user gestionale.
export async function deleteUserGestionale(req, res, next) {
    try {
        const result = await deleteGestionaleUser(req.params.id);
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Deletes the data for user app.
export async function deleteUserApp(req, res, next) {
    try {
        const result = await deleteMobileAppUser(req.params.id);
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Updates the data for user info gestionale.
export async function updateUserInfoGestionale(req, res, next) {
    try {
        const result = await updateGestionaleUserInfo({
            actingUserId: req.user?.id,
            actingUserRole: req.user?.role,
            targetUserId: req.params.id,
            payload: req.body || {},
        });
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Updates the data for user info app.
export async function updateUserInfoApp(req, res, next) {
    try {
        const result = await updateMobileAppUserInfo({
            targetUserId: req.params.id,
            payload: req.body || {},
        });
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Disables the data used by user app.
export async function disableUserApp(req, res, next) {
    try {
        const result = await disableMobileAppUser(req.params.id);
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Checks the current value for email.
export async function checkEmail(req, res, next) {
    try {
        const result = await checkBackofficeEmailAvailability(req.query.email);
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Creates the data for user gestionale.
export async function createUserGestionale(req, res, next) {
    try {
        const result = await createGestionaleUser(req.body || {});
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}