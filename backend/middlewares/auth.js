import { getSessionCookieClearOptions, getSessionCookieName, getSessionCookieOptions, signSessionToken, verifySessionToken } from '../config/authConfig.js';
import { loadAuthenticatedBackofficeUser } from '../services/authService.js';

export async function requireAuth(req, res, next) {
    const cookieName = getSessionCookieName();
    const token = req.cookies?.[cookieName];
    if (!token) {
        return res.status(401).json({ message: 'Non autenticato' });
    }

    try {
        const payload = verifySessionToken(token);
        const user = await loadAuthenticatedBackofficeUser(payload?.id);
        req.user = user;
        next();
    } catch (error) {
        res.clearCookie(cookieName, getSessionCookieClearOptions());

        const status = Number(error?.status ?? 401);
        return res.status(status).json({
            message:
                error?.message ||
                (status === 403 ? 'Permessi insufficienti' : 'Sessione non valida'),
            ...(error?.details?.code
                ? {
                      code: error.details.code,
                  }
                : {}),
        });
    }
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Non autenticato' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Permessi insufficienti' });
        }

        next();
    };
}

export function signSessionCookie(res, userPayload) {
    const cookieName = getSessionCookieName();
    const token = signSessionToken(userPayload);

    res.cookie(cookieName, token, getSessionCookieOptions());
}

export function clearSessionCookie(res) {
    res.clearCookie(getSessionCookieName(), getSessionCookieClearOptions());
}
