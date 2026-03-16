// Middleware helpers for upload food image.
import multer from 'multer';
import { HttpError } from '../utils/httpError.js';
import { storageConfig } from '../config/storageConfig.js';
import {
    buildFoodImageFilename,
    ensureFoodImagesDirectory,
} from '../services/fileStorageService.js';

await ensureFoodImagesDirectory();

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            await ensureFoodImagesDirectory();
            cb(null, storageConfig.foodImagesDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const filename = buildFoodImageFilename(file);
        if (!filename) {
            cb(new HttpError(400, 'Formato immagine non supportato'));
            return;
        }

        cb(null, filename);
    },
});

// Helper function used by upload food image.
export const uploadFoodImage = multer({
    storage,
    limits: { fileSize: storageConfig.maxFoodImageSizeBytes },
    fileFilter: (req, file, cb) => {
        if (!storageConfig.allowedFoodImageMimeTypes.includes(file.mimetype)) {
            cb(new HttpError(400, 'Sono supportate solo immagini JPG, PNG o WEBP'));
            return;
        }

        cb(null, true);
    },
});