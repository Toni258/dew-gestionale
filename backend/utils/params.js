// Backend utility helpers for params.
import { HttpError } from './httpError.js';

// Helper function used by decode trim.
export function decodeTrim(value) {
    return decodeURIComponent(String(value ?? '')).trim();
}

// Normalizes the value used by name.
export function normalizeName(value) {
    return String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

// Parses the value used by int strict.
export function parseIntStrict(value, { min, max, message } = {}) {
    const n = Number(value);
    if (!Number.isInteger(n))
        throw new HttpError(400, message ?? 'Numero non valido');
    if (min != null && n < min)
        throw new HttpError(400, message ?? 'Numero non valido');
    if (max != null && n > max)
        throw new HttpError(400, message ?? 'Numero non valido');
    return n;
}

// Helper function used by one of.
export function oneOf(value, allowed, message = 'Valore non valido') {
    const v = String(value ?? '')
        .trim()
        .toLowerCase();
    if (!allowed.includes(v)) throw new HttpError(400, message);
    return v;
}