import multer from 'multer';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
    logger.error('Unhandled backend error', {
        method: req.method,
        path: req.originalUrl,
        error: err,
    });

    if (err instanceof HttpError) {
        return res.status(err.status).json({
            error: err.message,
            details: err.details ?? undefined,
        });
    }

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'L’immagine supera la dimensione massima consentita (5 MB)',
            });
        }

        return res.status(400).json({
            error: 'Errore durante il caricamento dell’immagine',
        });
    }

    return res.status(500).json({ error: 'Errore interno al server' });
}
