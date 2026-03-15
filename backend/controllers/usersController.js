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

function handleServiceError(res, next, error) {
    if (error?.status) {
        return res.status(error.status).json({ message: error.message });
    }

    return next(error);
}

export async function getFilteredUsersMobileApp(req, res, next) {
    try {
        const result = await getFilteredMobileAppUsers(req.query || {});
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

export async function getFilteredUsersGestionale(req, res, next) {
    try {
        const result = await getFilteredBackofficeUsers(req.query || {});
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

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

export async function unsuspendUser(req, res, next) {
    try {
        const result = await unsuspendBackofficeUser(req.params.id);
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

export async function deleteUserGestionale(req, res, next) {
    try {
        const result = await deleteGestionaleUser(req.params.id);
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

export async function deleteUserApp(req, res, next) {
    try {
        const result = await deleteMobileAppUser(req.params.id);
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

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

export async function disableUserApp(req, res, next) {
    try {
        const result = await disableMobileAppUser(req.params.id);
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

export async function checkEmail(req, res, next) {
    try {
        const result = await checkBackofficeEmailAvailability(req.query.email);
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

export async function createUserGestionale(req, res, next) {
    try {
        const result = await createGestionaleUser(req.body || {});
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}
