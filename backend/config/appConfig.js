// Configuration helpers for app.
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    FOOD_IMAGES_PUBLIC_PATH,
    SESSION_COOKIE_NAME,
} from '../../shared/constants.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const backendDir = path.resolve(path.dirname(__filename), '..');
const projectRoot = path.resolve(backendDir, '..');

// Converts the input value into a boolean.
function toBool(value, defaultValue = false) {
    if (value == null || value === '') return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    return defaultValue;
}

// Converts the input value into an integer.
function toInt(value, defaultValue) {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : defaultValue;
}

// Normalizes the value used by mount path.
function normalizeMountPath(value, fallback) {
    const raw = String(value ?? fallback).trim();
    if (!raw) return fallback;

    const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
    return withLeadingSlash.replace(/\/+$/, '') || '/';
}

// Parses the value used by cors origins.
function parseCorsOrigins(value) {
    return String(value ?? '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
}

// Resolves the value used by path.
function resolvePath(baseDir, inputPath, fallbackRelativePath) {
    const raw = String(inputPath ?? '').trim();
    const value = raw || fallbackRelativePath;
    return path.isAbsolute(value) ? value : path.resolve(baseDir, value);
}

// Checks the request before continuing with string env.
function requireStringEnv(name, { allowEmpty = false } = {}) {
    const value = process.env[name];
    if (value == null) {
        throw new Error(`Variabile d'ambiente mancante: ${name}`);
    }

    const normalized = String(value).trim();
    if (!allowEmpty && !normalized) {
        throw new Error(`Variabile d'ambiente vuota: ${name}`);
    }

    return normalized;
}

const nodeEnv =
    String(process.env.NODE_ENV ?? 'development').trim() || 'development';
const isProduction = nodeEnv === 'production';

const port = toInt(process.env.PORT, 3001);
const dbPort = toInt(process.env.DB_PORT, 3306);
const jwtSecret = requireStringEnv('JWT_SECRET');
const corsOrigins = parseCorsOrigins(
    process.env.CORS_ORIGIN || 'http://localhost:5173',
);
const trustProxy = toBool(process.env.TRUST_PROXY, false);
const sessionCookieSecure = toBool(process.env.COOKIE_SECURE, isProduction);
const sessionCookieSameSite = String(process.env.COOKIE_SAME_SITE ?? 'lax')
    .trim()
    .toLowerCase();
const sessionCookieDomain = String(process.env.COOKIE_DOMAIN ?? '').trim();
const sessionDurationHours = toInt(process.env.SESSION_DURATION_HOURS, 8);
const foodImagesDir = resolvePath(
    backendDir,
    process.env.FOOD_IMAGES_DIR,
    '../storage/food-images',
);
const foodImagesPublicPath = normalizeMountPath(
    process.env.FOOD_IMAGES_PUBLIC_PATH,
    FOOD_IMAGES_PUBLIC_PATH,
);
const logDir = resolvePath(backendDir, process.env.LOG_DIR, '../logs');
const logLevel =
    String(process.env.LOG_LEVEL ?? 'info')
        .trim()
        .toLowerCase() || 'info';
const enableSchedulers = toBool(process.env.ENABLE_SCHEDULERS, false);
const schedulerLockName =
    String(process.env.SCHEDULER_LOCK_NAME ?? '').trim() ||
    'dew:process-expired-dish-suspensions';

// Helper function used by app config.
export const appConfig = {
    paths: {
        backendDir,
        projectRoot,
        foodImagesDir,
        logDir,
    },
    app: {
        nodeEnv,
        isProduction,
        port,
        trustProxy,
        corsOrigins,
    },
    db: {
        host: requireStringEnv('DB_HOST'),
        port: dbPort,
        user: requireStringEnv('DB_USER'),
        password: requireStringEnv('DB_PASSWORD', { allowEmpty: true }),
        database: requireStringEnv('DB_NAME'),
        connectionLimit: toInt(process.env.DB_CONNECTION_LIMIT, 10),
    },
    auth: {
        jwtSecret,
        sessionCookieName: SESSION_COOKIE_NAME,
        sessionDurationHours,
        sessionCookieSecure,
        sessionCookieSameSite,
        sessionCookieDomain,
    },
    storage: {
        foodImagesDir,
        foodImagesPublicPath,
        maxFoodImageSizeBytes: 5 * 1024 * 1024,
    },
    logging: {
        logDir,
        logLevel,
    },
    schedulers: {
        enableSchedulers,
        lockName: schedulerLockName,
    },
};