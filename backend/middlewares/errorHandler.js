import { HttpError } from '../utils/httpError.js';

export function errorHandler(err, req, res, next) {
    console.error(err);

    if (err instanceof HttpError) {
        return res.status(err.status).json({
            error: err.message,
            details: err.details ?? undefined,
        });
    }

    return res.status(500).json({ error: 'Errore interno al server' });
}
