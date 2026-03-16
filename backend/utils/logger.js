// Backend utility helpers for logger.
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { appConfig } from '../config/appConfig.js';

const LEVEL_ORDER = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

const currentLevel = LEVEL_ORDER[appConfig.logging.logLevel] ?? LEVEL_ORDER.info;
const logFilePath = path.join(appConfig.logging.logDir, 'backend.log');

let logDirectoryReady = false;

// Helper function used by ensure log directory.
async function ensureLogDirectory() {
    if (logDirectoryReady) return;
    await fsp.mkdir(appConfig.logging.logDir, { recursive: true });
    logDirectoryReady = true;
}

// Helper function used by can write.
function canWrite(level) {
    return (LEVEL_ORDER[level] ?? LEVEL_ORDER.info) >= currentLevel;
}

// Helper function used by serialize meta.
function serializeMeta(meta) {
    if (meta == null) return '';
    if (meta instanceof Error) {
        return JSON.stringify({
            name: meta.name,
            message: meta.message,
            stack: meta.stack,
        });
    }

    try {
        return JSON.stringify(meta);
    } catch {
        return JSON.stringify({ meta: String(meta) });
    }
}

// Formats the value used by line.
function formatLine(level, message, meta) {
    const timestamp = new Date().toISOString();
    const suffix = meta == null ? '' : ` ${serializeMeta(meta)}`;
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${suffix}`;
}

// Helper function used by write.
function write(level, message, meta) {
    if (!canWrite(level)) return;

    const line = formatLine(level, message, meta);

    if (level === 'error') {
        console.error(line);
    } else if (level === 'warn') {
        console.warn(line);
    } else {
        console.log(line);
    }

    ensureLogDirectory()
        .then(() => fsp.appendFile(logFilePath, `${line}\n`, 'utf-8'))
        .catch(() => {});
}

// Helper function used by logger.
export const logger = {
    debug(message, meta) {
        write('debug', message, meta);
    },
    info(message, meta) {
        write('info', message, meta);
    },
    warn(message, meta) {
        write('warn', message, meta);
    },
    error(message, meta) {
        write('error', message, meta);
    },
};

// Helper function used by ensure runtime directories.
export async function ensureRuntimeDirectories() {
    await Promise.all([
        ensureLogDirectory(),
        fsp.mkdir(appConfig.storage.foodImagesDir, { recursive: true }),
    ]);
}

// Helper function used by ensure runtime directories sync.
export function ensureRuntimeDirectoriesSync() {
    fs.mkdirSync(appConfig.logging.logDir, { recursive: true });
    fs.mkdirSync(appConfig.storage.foodImagesDir, { recursive: true });
    logDirectoryReady = true;
}