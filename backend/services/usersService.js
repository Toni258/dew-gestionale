import bcrypt from 'bcrypt';
import { pool } from '../db/db.js';
import { HttpError } from '../utils/httpError.js';
import {
    BACKOFFICE_ROLES,
} from '../../shared/constants.js';
import {
    backofficeEmailExists,
    countBackofficeUsers,
    createBackofficeUser,
    deleteBackofficeUser,
    findBackofficeUserById,
    listBackofficeUsers,
    updateBackofficeUserInfo,
    updateBackofficeUserPasswordAndStatus,
    updateBackofficeUserStatus,
} from '../repositories/backofficeUsersRepo.js';
import {
    caregiverEmailExists,
    countCaregivers,
    deleteCaregiver,
    disableCaregiver,
    findCaregiverById,
    listCaregivers,
    updateCaregiverInfo,
} from '../repositories/caregiverRepo.js';

function paginate({ page, pageSize, total, rows }) {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 30));

    return {
        data: rows,
        page: safePage,
        pageSize: safePageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    };
}

function normalizeText(value, label) {
    const normalized = String(value ?? '').trim();
    if (!normalized || normalized.length < 2) {
        throw new HttpError(400, `${label} non valido`);
    }

    return normalized;
}

function normalizeEmail(value) {
    const email = String(value ?? '').trim().toLowerCase();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !re.test(email)) {
        throw new HttpError(400, 'Email non valida');
    }

    return email;
}

export async function getFilteredMobileAppUsers(query = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 30));

    const [rows, total] = await Promise.all([
        listCaregivers(pool, {
            search: query.search,
            role: query.ruolo,
            page,
            pageSize,
        }),
        countCaregivers(pool, {
            search: query.search,
            role: query.ruolo,
        }),
    ]);

    return paginate({ page, pageSize, total, rows });
}

export async function getFilteredBackofficeUsers(query = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 30));

    const [rows, total] = await Promise.all([
        listBackofficeUsers(pool, {
            search: query.search,
            role: query.ruolo,
            status: query.status,
            page,
            pageSize,
        }),
        countBackofficeUsers(pool, {
            search: query.search,
            role: query.ruolo,
            status: query.status,
        }),
    ]);

    return paginate({ page, pageSize, total, rows });
}

export async function adminResetPassword({ targetUserId, newPassword }) {
    const numericId = Number(targetUserId);
    if (!numericId) {
        throw new HttpError(400, 'ID utente non valido');
    }

    if (!newPassword || String(newPassword).length < 8) {
        throw new HttpError(400, 'La nuova password deve avere almeno 8 caratteri');
    }

    const target = await findBackofficeUserById(pool, numericId);
    if (!target) {
        throw new HttpError(404, 'Utente non trovato');
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await updateBackofficeUserPasswordAndStatus(pool, {
        userId: numericId,
        passwordHash,
        status: 'must_change_password',
    });

    return { ok: true };
}

export async function suspendBackofficeUser({ actingUserId, targetUserId }) {
    const numericId = Number(targetUserId);
    if (!numericId) {
        throw new HttpError(400, 'ID utente non valido');
    }

    if (Number(actingUserId) === numericId) {
        throw new HttpError(400, 'Non puoi sospendere te stesso');
    }

    const affected = await updateBackofficeUserStatus(pool, {
        userId: numericId,
        status: 'suspended',
    });

    if (!affected) {
        throw new HttpError(404, 'Utente non trovato');
    }

    return { ok: true };
}

export async function unsuspendBackofficeUser(targetUserId) {
    const numericId = Number(targetUserId);
    if (!numericId) {
        throw new HttpError(400, 'ID utente non valido');
    }

    const target = await findBackofficeUserById(pool, numericId);
    if (!target) {
        throw new HttpError(404, 'Utente non trovato');
    }

    const nextStatus =
        target.status === 'must_change_password' ? 'must_change_password' : 'active';

    await updateBackofficeUserStatus(pool, {
        userId: numericId,
        status: nextStatus,
    });

    return { ok: true };
}

export async function deleteGestionaleUser(targetUserId) {
    const numericId = Number(targetUserId);
    if (!numericId) {
        throw new HttpError(400, 'ID utente non valido');
    }

    const affected = await deleteBackofficeUser(pool, numericId);
    if (!affected) {
        throw new HttpError(404, 'Utente non trovato');
    }

    return { ok: true };
}

export async function deleteMobileAppUser(targetUserId) {
    const numericId = Number(targetUserId);
    if (!numericId) {
        throw new HttpError(400, 'ID utente non valido');
    }

    const target = await findCaregiverById(pool, numericId);
    if (!target) {
        throw new HttpError(404, 'Utente non trovato');
    }

    const affected = await deleteCaregiver(pool, numericId);
    if (!affected) {
        throw new HttpError(404, 'Utente non trovato');
    }

    return { ok: true };
}

export async function updateGestionaleUserInfo({ actingUserId, targetUserId, payload, actingUserRole }) {
    const numericId = Number(targetUserId);
    if (!numericId) {
        throw new HttpError(400, 'ID utente non valido');
    }

    const name = normalizeText(payload?.name, 'Nome');
    const surname = normalizeText(payload?.surname, 'Cognome');
    const email = normalizeEmail(payload?.email);
    const role = String(payload?.role ?? '').trim();

    if (!BACKOFFICE_ROLES.includes(role)) {
        throw new HttpError(400, 'Ruolo non valido');
    }

    if (Number(actingUserId) === numericId && role !== actingUserRole) {
        throw new HttpError(400, 'Non puoi cambiare il tuo ruolo');
    }

    const target = await findBackofficeUserById(pool, numericId);
    if (!target) {
        throw new HttpError(404, 'Utente non trovato');
    }

    const duplicate = await backofficeEmailExists(pool, email, {
        excludeUserId: numericId,
    });
    if (duplicate) {
        throw new HttpError(409, 'Email già in uso');
    }

    await updateBackofficeUserInfo(pool, {
        userId: numericId,
        name,
        surname,
        email,
        role,
    });

    const fresh = await findBackofficeUserById(pool, numericId);
    return { ok: true, user: fresh };
}

export async function updateMobileAppUserInfo({ targetUserId, payload }) {
    const numericId = Number(targetUserId);
    if (!numericId) {
        throw new HttpError(400, 'ID utente non valido');
    }

    const name = normalizeText(payload?.name, 'Nome');
    const surname = normalizeText(payload?.surname, 'Cognome');
    const email = normalizeEmail(payload?.email);
    const role = String(payload?.role ?? '').trim();
    const allowedRoles = ['super_user', 'caregiver', 'Altro'];

    if (!allowedRoles.includes(role)) {
        throw new HttpError(400, 'Ruolo non valido');
    }

    const target = await findCaregiverById(pool, numericId);
    if (!target) {
        throw new HttpError(404, 'Utente non trovato');
    }

    const duplicate = await caregiverEmailExists(pool, email, {
        excludeCaregiverId: numericId,
    });
    if (duplicate) {
        throw new HttpError(409, 'Email già in uso');
    }

    await updateCaregiverInfo(pool, {
        caregiverId: numericId,
        name,
        surname,
        email,
        role,
    });

    const fresh = await findCaregiverById(pool, numericId);
    return {
        ok: true,
        user: fresh
            ? {
                  id_caregiver: fresh.id_caregiver,
                  email: fresh.email,
                  name: fresh.name,
                  surname: fresh.surname,
                  role: fresh.role,
              }
            : null,
    };
}

export async function disableMobileAppUser(targetUserId) {
    const numericId = Number(targetUserId);
    if (!numericId) {
        throw new HttpError(400, 'ID utente non valido');
    }

    const affected = await disableCaregiver(pool, numericId);
    if (!affected) {
        throw new HttpError(404, 'Utente non trovato');
    }

    return { ok: true };
}

export async function checkBackofficeEmailAvailability(email) {
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail.length < 3) {
        throw new HttpError(400, 'Email utente non valida');
    }

    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(normalizedEmail)) {
        throw new HttpError(400, 'Email utente non valida / Scritta male');
    }

    const exists = await backofficeEmailExists(pool, normalizedEmail);
    return { exists };
}

export async function createGestionaleUser(payload) {
    const name = normalizeText(payload?.name, 'Nome');
    const surname = normalizeText(payload?.surname, 'Cognome');
    const email = normalizeEmail(payload?.email);
    const password = String(payload?.password ?? '');
    const role = String(payload?.role ?? '').trim();

    if (password.length < 8) {
        throw new HttpError(400, 'Password non valida');
    }

    if (!BACKOFFICE_ROLES.includes(role)) {
        throw new HttpError(400, 'Ruolo non valido');
    }

    const duplicate = await backofficeEmailExists(pool, email);
    if (duplicate) {
        throw new HttpError(409, 'Email già in uso');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await createBackofficeUser(pool, {
        email,
        passwordHash,
        name,
        surname,
        role,
    });

    return { ok: true, userId };
}
