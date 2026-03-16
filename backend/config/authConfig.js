// Configuration helpers for auth.
import jwt from 'jsonwebtoken';
import { appConfig } from './appConfig.js';

const sessionMaxAgeMs = appConfig.auth.sessionDurationHours * 60 * 60 * 1000;

// Builds the data needed for base cookie options.
function buildBaseCookieOptions() {
    const options = {
        httpOnly: true,
        sameSite: appConfig.auth.sessionCookieSameSite,
        secure: appConfig.auth.sessionCookieSecure,
        maxAge: sessionMaxAgeMs,
        path: '/',
    };

    if (appConfig.auth.sessionCookieDomain) {
        options.domain = appConfig.auth.sessionCookieDomain;
    }

    return options;
}

// Creates the value used by session token.
export function signSessionToken(payload) {
    return jwt.sign(payload, appConfig.auth.jwtSecret, {
        expiresIn: `${appConfig.auth.sessionDurationHours}h`,
    });
}

// Helper function used by verify session token.
export function verifySessionToken(token) {
    return jwt.verify(token, appConfig.auth.jwtSecret);
}

// Returns the data used by session cookie name.
export function getSessionCookieName() {
    return appConfig.auth.sessionCookieName;
}

// Returns the data used by session cookie options.
export function getSessionCookieOptions() {
    return buildBaseCookieOptions();
}

// Returns the data used by session cookie clear options.
export function getSessionCookieClearOptions() {
    const options = buildBaseCookieOptions();
    delete options.maxAge;
    return options;
}