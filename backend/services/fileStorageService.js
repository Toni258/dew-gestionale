// Service layer used for file storage.
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { storageConfig } from '../config/storageConfig.js';
import { logger } from '../utils/logger.js';

// Helper function used by ensure food images directory.
export async function ensureFoodImagesDirectory() {
    await fs.mkdir(storageConfig.foodImagesDir, { recursive: true });
}

// Builds the data needed for food image filename.
export function buildFoodImageFilename(file) {
    const ext = storageConfig.resolveFoodImageExtension(file);
    if (!ext) {
        return null;
    }

    return `${Date.now()}-${crypto.randomUUID()}${ext}`;
}

// Resolves the value used by food image absolute path.
export function resolveFoodImageAbsolutePath(filename) {
    return path.join(storageConfig.foodImagesDir, String(filename ?? ''));
}

// Returns the data used by food image public url.
export function getFoodImagePublicUrl(filename) {
    if (!filename) return null;
    const encodedFilename = encodeURIComponent(filename);
    return `${storageConfig.foodImagesPublicPath}/${encodedFilename}`;
}

// Deletes the data for food image file.
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

// Helper function used by cleanup uploaded food image.
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