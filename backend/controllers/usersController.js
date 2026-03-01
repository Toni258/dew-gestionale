import { pool } from '../db/db.js';
import path from 'path';
import fs from 'fs/promises';
import bcrypt from 'bcrypt';

export async function getFilteredUsersMobileApp(req, res) {
    try {
        const {
            search = '',
            ruolo = '',
            page = '1',
            pageSize = '30',
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const sizeNum = Math.min(
            100,
            Math.max(1, parseInt(pageSize, 10) || 30),
        );
        const offset = (pageNum - 1) * sizeNum;

        // ===============================
        // BASE WHERE
        // ===============================
        let where = ` WHERE 1=1 `;
        const params = [];

        if (search.trim()) {
            where += ` AND ( c.name LIKE ? OR c.surname LIKE ?)`;

            const term = `%${search.trim()}%`;
            params.push(term, term);
        }

        if (ruolo) {
            where += ` AND c.role = ? `;
            params.push(ruolo);
        }

        // ===============================
        // COUNT
        // ===============================
        const countSql = `
            SELECT COUNT(DISTINCT c.id_caregiver) AS total
            FROM caregiver c
            ${where}
        `;

        const [countRows] = await pool.query(countSql, params);
        const total = countRows[0]?.total ?? 0;

        // ===============================
        // DATA
        // ===============================
        const dataSql = `
            SELECT 
                c.id_caregiver,
                c.email,
                c.name,
                c.surname,
                c.role,
                c.acceptance_time,
                c.acceptance_ip,
                (c.password_hash = 'Utente disabilitato') AS is_disabled
            
            FROM caregiver c

            ${where}

            ORDER BY c.id_caregiver ASC
            LIMIT ? OFFSET ?
        `;

        const dataParams = [...params, sizeNum, offset];

        const [rows] = await pool.query(dataSql, dataParams);

        return res.json({
            data: rows,
            page: pageNum,
            pageSize: sizeNum,
            total,
            totalPages: Math.ceil(total / sizeNum),
        });
    } catch (err) {
        console.error('ERRORE QUERY:', err);
        return res.status(500).json({ error: 'Errore interno al server' });
    }
}

export async function getFilteredUsersGestionale(req, res) {
    try {
        const {
            search = '',
            ruolo = '',
            status = '',
            page = '1',
            pageSize = '30',
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const sizeNum = Math.min(
            100,
            Math.max(1, parseInt(pageSize, 10) || 30),
        );
        const offset = (pageNum - 1) * sizeNum;

        // ===============================
        // BASE WHERE
        // ===============================
        let where = ` WHERE 1=1 `;
        const params = [];

        if (search.trim()) {
            where += ` AND ( c.name LIKE ? OR c.surname LIKE ?)`;

            const term = `%${search.trim()}%`;
            params.push(term, term);
        }

        if (ruolo) {
            where += ` AND c.role = ? `;
            params.push(ruolo);
        }

        if (status) {
            where += ` AND c.status = ? `;
            params.push(status);
        }

        // ===============================
        // COUNT
        // ===============================
        const countSql = `
            SELECT COUNT(DISTINCT c.id) AS total
            FROM backoffice_users c
            ${where}
        `;

        const [countRows] = await pool.query(countSql, params);
        const total = countRows[0]?.total ?? 0;

        // ===============================
        // DATA
        // ===============================
        const dataSql = `
            SELECT 
                c.id,
                c.email,
                c.name,
                c.surname,
                c.role,
                c.status,
                c.last_login_at,
                c.created_at,
                c.updated_at
            
            FROM backoffice_users c

            ${where}

            ORDER BY c.id ASC
            LIMIT ? OFFSET ?
        `;

        const dataParams = [...params, sizeNum, offset];

        const [rows] = await pool.query(dataSql, dataParams);

        return res.json({
            data: rows,
            page: pageNum,
            pageSize: sizeNum,
            total,
            totalPages: Math.ceil(total / sizeNum),
        });
    } catch (err) {
        console.error('ERRORE QUERY:', err);
        return res.status(500).json({ error: 'Errore interno al server' });
    }
}

export async function resetPasswordAdmin(req, res, next) {
    try {
        const targetUserId = Number(req.params.id);
        const { newPassword } = req.body || {};

        if (!targetUserId) {
            return res.status(400).json({ message: 'ID utente non valido' });
        }
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({
                message: 'La nuova password deve avere almeno 8 caratteri',
            });
        }

        const [rows] = await pool.query(
            `SELECT id, status FROM backoffice_users WHERE id = ?`,
            [targetUserId],
        );
        const target = rows?.[0];
        if (!target) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);

        await pool.query(
            `
        UPDATE backoffice_users
        SET password_hash = ?, status = 'must_change_password', updated_at = NOW()
        WHERE id = ?
      `,
            [newHash, targetUserId],
        );

        return res.json({ ok: true });
    } catch (e) {
        next(e);
    }
}

export async function suspendUser(req, res, next) {
    try {
        const targetUserId = Number(req.params.id);
        if (!targetUserId) {
            return res.status(400).json({ message: 'ID utente non valido' });
        }

        // opzionale: non sospendere super_user (a tua scelta)
        // o non sospendere se stesso lato backend (più serio)
        if (req.user?.id === targetUserId) {
            return res
                .status(400)
                .json({ message: 'Non puoi sospendere te stesso' });
        }

        await pool.query(
            `
                UPDATE backoffice_users
                SET status = 'suspended', updated_at = NOW()
                WHERE id = ?
            `,
            [targetUserId],
        );

        return res.json({ ok: true });
    } catch (e) {
        next(e);
    }
}

export async function unsuspendUser(req, res, next) {
    try {
        const targetUserId = Number(req.params.id);
        if (!targetUserId) {
            return res.status(400).json({ message: 'ID utente non valido' });
        }

        await pool.query(
            `
                UPDATE backoffice_users
                SET status = 'active', updated_at = NOW()
                WHERE id = ?
            `,
            [targetUserId],
        );

        return res.json({ ok: true });
    } catch (e) {
        next(e);
    }
}

export async function deleteUserGestionale(req, res, next) {
    try {
        const targetUserId = Number(req.params.id);
        if (!targetUserId) {
            return res.status(400).json({ message: 'ID utente non valido' });
        }

        // non puoi eliminare te stesso
        if (req.user?.id === targetUserId) {
            return res
                .status(400)
                .json({ message: 'Non puoi eliminare te stesso' });
        }

        // verifica esistenza
        const [rows] = await pool.query(
            `SELECT id, role FROM backoffice_users WHERE id = ?`,
            [targetUserId],
        );
        const target = rows?.[0];
        if (!target) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }

        // se in futuro si vuole impedire eliminazione di altri super_user
        // if (target.role === 'super_user') {
        //   return res.status(403).json({ message: 'Non puoi eliminare un super user' });
        // }

        const [result] = await pool.query(
            `DELETE FROM backoffice_users WHERE id = ?`,
            [targetUserId],
        );

        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }

        return res.json({ ok: true });
    } catch (e) {
        next(e);
    }
}

export async function deleteUserApp(req, res, next) {
    try {
        console.log('Entrato 1');
        const targetUserId = Number(req.params.id);
        if (!targetUserId) {
            return res.status(400).json({ message: 'ID utente non valido' });
        }

        console.log('Entrato e con ID:', targetUserId);

        // verifica esistenza
        const [rows] = await pool.query(
            `SELECT id_caregiver FROM caregiver WHERE id_caregiver = ?`,
            [targetUserId],
        );
        const target = rows?.[0];

        if (!target) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }

        const [result] = await pool.query(
            `DELETE FROM caregiver WHERE id_caregiver = ?`,
            [targetUserId],
        );

        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }

        return res.json({ ok: true });
    } catch (e) {
        next(e);
    }
}

export async function updateUserInfoGestionale(req, res, next) {
    try {
        const targetUserId = Number(req.params.id);
        const { name, surname, email, role } = req.body || {};

        if (!targetUserId) {
            return res.status(400).json({ message: 'ID utente non valido' });
        }

        const cleanName = String(name ?? '').trim();
        const cleanSurname = String(surname ?? '').trim();
        const cleanEmail = String(email ?? '')
            .trim()
            .toLowerCase();
        const newRole = String(role ?? '').trim();

        if (!cleanName || cleanName.length < 2) {
            return res.status(400).json({ message: 'Nome non valido' });
        }
        if (!cleanSurname || cleanSurname.length < 2) {
            return res.status(400).json({ message: 'Cognome non valido' });
        }
        if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({ message: 'Email non valida' });
        }

        const allowedRoles = ['super_user', 'operator'];
        if (!newRole || !allowedRoles.includes(newRole)) {
            return res.status(400).json({ message: 'Ruolo non valido' });
        }

        // evita che un super user si tolga i permessi da solo
        if (req.user?.id === targetUserId && newRole !== req.user?.role) {
            return res
                .status(400)
                .json({ message: 'Non puoi cambiare il tuo ruolo' });
        }

        // verifica esistenza utente
        const [existsRows] = await pool.query(
            `SELECT id FROM backoffice_users WHERE id = ?`,
            [targetUserId],
        );
        if (!existsRows?.[0]) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }

        // controllo email duplicata
        const [dupRows] = await pool.query(
            `SELECT id FROM backoffice_users WHERE email = ? AND id <> ?`,
            [cleanEmail, targetUserId],
        );
        if (dupRows?.length) {
            return res.status(409).json({ message: 'Email già in uso' });
        }

        // update
        await pool.query(
            `
                UPDATE backoffice_users
                SET name = ?, surname = ?, email = ?, role = ?, updated_at = NOW()
                WHERE id = ?
            `,
            [cleanName, cleanSurname, cleanEmail, newRole, targetUserId],
        );

        // ritorno utente aggiornato (utile se vuoi usarlo)
        const [rows] = await pool.query(
            `
                SELECT id, email, name, surname, role, status, last_login_at, created_at, updated_at
                FROM backoffice_users
                WHERE id = ?
            `,
            [targetUserId],
        );

        return res.json({ ok: true, user: rows?.[0] });
    } catch (e) {
        next(e);
    }
}

export async function updateUserInfoApp(req, res, next) {
    try {
        const targetUserId = Number(req.params.id);
        const { name, surname, email, role } = req.body || {};

        if (!targetUserId) {
            return res.status(400).json({ message: 'ID utente non valido' });
        }

        const cleanName = String(name ?? '').trim();
        const cleanSurname = String(surname ?? '').trim();
        const cleanEmail = String(email ?? '')
            .trim()
            .toLowerCase();
        const newRole = String(role ?? '').trim();

        if (!cleanName || cleanName.length < 2) {
            return res.status(400).json({ message: 'Nome non valido' });
        }
        if (!cleanSurname || cleanSurname.length < 2) {
            return res.status(400).json({ message: 'Cognome non valido' });
        }
        if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({ message: 'Email non valida' });
        }

        const allowedRoles = ['super_user', 'caregiver', 'Altro'];
        if (!newRole || !allowedRoles.includes(newRole)) {
            return res.status(400).json({ message: 'Ruolo non valido' });
        }

        // verifica esistenza utente
        const [existsRows] = await pool.query(
            `SELECT id_caregiver FROM caregiver WHERE id_caregiver = ?`,
            [targetUserId],
        );
        if (!existsRows?.[0]) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }

        // controllo email duplicata
        const [dupRows] = await pool.query(
            `SELECT id_caregiver FROM caregiver WHERE email = ? AND id_caregiver <> ?`,
            [cleanEmail, targetUserId],
        );
        if (dupRows?.length) {
            return res.status(409).json({ message: 'Email già in uso' });
        }

        // update
        await pool.query(
            `
                UPDATE caregiver
                SET name = ?, surname = ?, email = ?, role = ?
                WHERE id_caregiver = ?
            `,
            [cleanName, cleanSurname, cleanEmail, newRole, targetUserId],
        );

        // ritorno utente aggiornato (utile se poi voglio usarlo)
        const [rows] = await pool.query(
            `
                SELECT id_caregiver, email, name, surname, role
                FROM caregiver
                WHERE id_caregiver = ?
            `,
            [targetUserId],
        );

        return res.json({ ok: true, user: rows?.[0] });
    } catch (e) {
        next(e);
    }
}

export async function disableUserApp(req, res, next) {
    try {
        const targetUserId = Number(req.params.id);
        if (!targetUserId) {
            return res.status(400).json({ message: 'ID utente non valido' });
        }

        await pool.query(
            `
                UPDATE caregiver
                SET password_hash = "Utente disabilitato"
                WHERE id_caregiver = ?
            `,
            [targetUserId],
        );

        return res.json({ ok: true });
    } catch (e) {
        next(e);
    }
}
