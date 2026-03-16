// Service layer used for auth.
import bcrypt from 'bcrypt';
import { pool } from '../db/db.js';
import { HttpError } from '../utils/httpError.js';
import {
    findBackofficeUserByEmail,
    findBackofficeUserById,
    markBackofficeUserPasswordResetRequested,
    updateBackofficeUserLastLoginAt,
    updateBackofficeUserPasswordAndStatus,
} from '../repositories/backofficeUsersRepo.js';

// Helper function used by sanitize user.
function sanitizeUser(user) {
    if (!user) return null;

    return {
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        surname: user.surname,
        status: user.status,
        last_login_at: user.last_login_at ?? null,
        created_at: user.created_at ?? null,
        updated_at: user.updated_at ?? null,
    };
}

// Helper function used by make session payload.
export function makeSessionPayload(user) {
    return {
        id: user.id,
    };
}

// Helper function used by authenticate backoffice user.
export async function authenticateBackofficeUser({ email, password }) {
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    const normalizedPassword = String(password ?? '');

    if (!normalizedEmail || !normalizedPassword) {
        throw new HttpError(400, 'Email e password obbligatorie');
    }

    const user = await findBackofficeUserByEmail(pool, normalizedEmail);
    if (!user) {
        throw new HttpError(401, 'Credenziali non valide');
    }

    if (user.status === 'suspended') {
        throw new HttpError(403, 'Utente sospeso');
    }

    if (user.status === 'password_reset_requested') {
        throw new HttpError(403, 'Hai già richiesto il reset della password. Attendi che il super user imposti una password temporanea.', {
            code: 'PASSWORD_RESET_REQUESTED',
        });
    }

    const ok = await bcrypt.compare(normalizedPassword, user.password_hash);
    if (!ok) {
        throw new HttpError(401, 'Credenziali non valide');
    }

    await updateBackofficeUserLastLoginAt(pool, user.id);

    const freshUser = await findBackofficeUserById(pool, user.id);
    if (!freshUser) {
        throw new HttpError(404, 'Utente non trovato');
    }

    return sanitizeUser(freshUser);
}

// Loads the data used by authenticated backoffice user.
export async function loadAuthenticatedBackofficeUser(userId) {
    const numericUserId = Number(userId);
    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
        throw new HttpError(401, 'Sessione non valida');
    }

    const user = await findBackofficeUserById(pool, numericUserId);
    if (!user) {
        throw new HttpError(401, 'Sessione non valida');
    }

    if (user.status === 'suspended') {
        throw new HttpError(403, 'Utente sospeso');
    }

    if (user.status === 'password_reset_requested') {
        throw new HttpError(403, 'Hai richiesto il reset della password. Attendi una password temporanea dal super user.', {
            code: 'PASSWORD_RESET_REQUESTED',
        });
    }

    return sanitizeUser(user);
}

// Helper function used by change authenticated user password.
export async function changeAuthenticatedUserPassword({ userId, currentPassword, newPassword }) {
    const numericUserId = Number(userId);

    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
        throw new HttpError(401, 'Non autenticato');
    }

    if (!currentPassword) {
        throw new HttpError(400, 'Password attuale obbligatoria');
    }

    if (!newPassword || String(newPassword).length < 8) {
        throw new HttpError(400, 'La nuova password deve avere almeno 8 caratteri');
    }

    const user = await findBackofficeUserById(pool, numericUserId);
    if (!user) {
        throw new HttpError(404, 'Utente non trovato');
    }

    if (user.status === 'suspended') {
        throw new HttpError(403, 'Utente sospeso');
    }

    const ok = await bcrypt.compare(String(currentPassword), user.password_hash);
    if (!ok) {
        throw new HttpError(401, 'Password attuale non corretta');
    }

    const newHash = await bcrypt.hash(String(newPassword), 10);
    await updateBackofficeUserPasswordAndStatus(pool, {
        userId: numericUserId,
        passwordHash: newHash,
        status: 'active',
    });

    const freshUser = await findBackofficeUserById(pool, numericUserId);
    return sanitizeUser(freshUser);
}

// Helper function used by request backoffice password reset.
export async function requestBackofficePasswordReset(email) {
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    if (!normalizedEmail) {
        throw new HttpError(400, 'Email obbligatoria');
    }

    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(normalizedEmail)) {
        throw new HttpError(400, 'Email non valida');
    }

    const user = await findBackofficeUserByEmail(pool, normalizedEmail);
    if (!user) {
        throw new HttpError(404, 'Nessun utente del gestionale trovato con questa email');
    }

    if (user.status === 'suspended') {
        throw new HttpError(403, 'Utente sospeso. Contatta il super user.');
    }

    if (user.status === 'password_reset_requested') {
        return {
            ok: true,
            alreadyRequested: true,
            message: 'La richiesta di reset password è già stata inviata al super user.',
        };
    }

    await markBackofficeUserPasswordResetRequested(pool, user.id);

    return {
        ok: true,
        message: 'Richiesta inviata correttamente. Il super user imposterà una password temporanea.',
    };
}