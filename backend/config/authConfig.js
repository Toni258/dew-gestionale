import jwt from 'jsonwebtoken';
import { appConfig } from './appConfig.js';

const sessionMaxAgeMs = appConfig.auth.sessionDurationHours * 60 * 60 * 1000;

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

export function signSessionToken(payload) {
    return jwt.sign(payload, appConfig.auth.jwtSecret, {
        expiresIn: `${appConfig.auth.sessionDurationHours}h`,
    });
}

export function verifySessionToken(token) {
    return jwt.verify(token, appConfig.auth.jwtSecret);
}

export function getSessionCookieName() {
    return appConfig.auth.sessionCookieName;
}

export function getSessionCookieOptions() {
    return buildBaseCookieOptions();
}

export function getSessionCookieClearOptions() {
    const options = buildBaseCookieOptions();
    delete options.maxAge;
    return options;
}
