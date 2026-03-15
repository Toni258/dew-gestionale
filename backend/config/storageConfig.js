import path from 'path';
import { appConfig } from './appConfig.js';

const MIME_EXTENSION_MAP = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};

const ALLOWED_FOOD_IMAGE_MIME_TYPES = Object.keys(MIME_EXTENSION_MAP);

function resolveFoodImageExtension(file) {
    const byMime = MIME_EXTENSION_MAP[file?.mimetype];
    if (byMime) return byMime;

    const originalExtension = path.extname(String(file?.originalname ?? '')).toLowerCase();
    if (Object.values(MIME_EXTENSION_MAP).includes(originalExtension)) {
        return originalExtension;
    }

    return null;
}

export const storageConfig = {
    foodImagesDir: appConfig.storage.foodImagesDir,
    foodImagesPublicPath: appConfig.storage.foodImagesPublicPath,
    maxFoodImageSizeBytes: appConfig.storage.maxFoodImageSizeBytes,
    allowedFoodImageMimeTypes: ALLOWED_FOOD_IMAGE_MIME_TYPES,
    resolveFoodImageExtension,
};
