import { HttpError } from './httpError.js';

export function decodeTrim(value) {
    return decodeURIComponent(String(value ?? '')).trim();
}

export function normalizeName(value) {
    return String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

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

export function oneOf(value, allowed, message = 'Valore non valido') {
    const v = String(value ?? '')
        .trim()
        .toLowerCase();
    if (!allowed.includes(v)) throw new HttpError(400, message);
    return v;
}
