// Controller handlers for auth.
import { clearSessionCookie, signSessionCookie } from '../middlewares/auth.js';
import {
    authenticateBackofficeUser,
    changeAuthenticatedUserPassword,
    makeSessionPayload,
    requestBackofficePasswordReset,
} from '../services/authService.js';

// Helper function used by login.
export async function login(req, res, next) {
    try {
        const user = await authenticateBackofficeUser(req.body || {});
        signSessionCookie(res, makeSessionPayload(user));
        return res.json({ user });
    } catch (error) {
        if (error?.details?.code === 'PASSWORD_RESET_REQUESTED') {
            return res.status(error.status).json({
                code: error.details.code,
                message: error.message,
            });
        }

        if (error?.status) {
            return res.status(error.status).json({ message: error.message });
        }

        next(error);
    }
}

// Helper function used by logout.
export function logout(req, res) {
    clearSessionCookie(res);
    res.json({ ok: true });
}

// Helper function used by me.
export function me(req, res) {
    res.json({ user: req.user });
}

// Helper function used by change password.
export async function changePassword(req, res, next) {
    try {
        const user = await changeAuthenticatedUserPassword({
            userId: req.user?.id,
            currentPassword: req.body?.currentPassword,
            newPassword: req.body?.newPassword,
        });

        signSessionCookie(res, makeSessionPayload(user));
        return res.json({ user });
    } catch (error) {
        if (error?.status) {
            return res.status(error.status).json({ message: error.message });
        }

        next(error);
    }
}

// Helper function used by request password reset.
export async function requestPasswordReset(req, res, next) {
    try {
        const result = await requestBackofficePasswordReset(req.body?.email);
        return res.json(result);
    } catch (error) {
        if (error?.status) {
            return res.status(error.status).json({
                ...(error?.details?.code
                    ? {
                          code: error.details.code,
                      }
                    : {}),
                message: error.message,
            });
        }

        next(error);
    }
}