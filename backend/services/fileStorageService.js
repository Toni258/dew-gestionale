import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { storageConfig } from '../config/storageConfig.js';
import { logger } from '../utils/logger.js';

export async function ensureFoodImagesDirectory() {
    await fs.mkdir(storageConfig.foodImagesDir, { recursive: true });
}

export function buildFoodImageFilename(file) {
    const ext = storageConfig.resolveFoodImageExtension(file);
    if (!ext) {
        return null;
    }

    return `${Date.now()}-${crypto.randomUUID()}${ext}`;
}

export function resolveFoodImageAbsolutePath(filename) {
    return path.join(storageConfig.foodImagesDir, String(filename ?? ''));
}

export function getFoodImagePublicUrl(filename) {
    if (!filename) return null;
    const encodedFilename = encodeURIComponent(filename);
    return `${storageConfig.foodImagesPublicPath}/${encodedFilename}`;
}

export async function deleteFoodImageFile(filename) {
    if (!filename) return false;

    try {
        await fs.unlink(resolveFoodImageAbsolutePath(filename));
        return true;
    } catch (error) {
        if (error?.code !== 'ENOENT') {
            logger.warn('Errore cancellazione immagine piatto', {
                filename,
                error,
            });
        }

        return false;
    }
}

export async function cleanupUploadedFoodImage(file) {
    if (!file?.path) return;

    try {
        await fs.unlink(file.path);
    } catch (error) {
        if (error?.code !== 'ENOENT') {
            logger.warn('Errore pulizia file upload temporaneo', {
                filePath: file.path,
                error,
            });
        }
    }
}
