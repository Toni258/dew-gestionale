import bcrypt from 'bcrypt';
import { pool } from '../db/db.js';
import { signSessionCookie } from '../middlewares/auth.js';

export async function login(req, res, next) {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: 'Email e password obbligatorie' });
        }

        const [rows] = await pool.query(
            `SELECT id, role, email, name, surname, status, password_hash
             FROM backoffice_users
             WHERE email = ?`,
            [email.trim().toLowerCase()],
        );

        const user = rows?.[0];
        if (!user)
            return res.status(401).json({ message: 'Credenziali non valide' });

        if (user.status === 'suspended') {
            return res.status(403).json({ message: 'Utente sospeso' });
        }

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok)
            return res.status(401).json({ message: 'Credenziali non valide' });

        await pool.query(
            `UPDATE backoffice_users SET last_login_at = NOW() WHERE id = ?`,
            [user.id],
        );

        signSessionCookie(res, {
            id: user.id,
            role: user.role,
            email: user.email,
            name: user.name,
            surname: user.surname,
            status: user.status,
        });

        return res.json({
            user: {
                id: user.id,
                role: user.role,
                email: user.email,
                name: user.name,
                surname: user.surname,
                status: user.status,
            },
        });
    } catch (e) {
        next(e);
    }
}

export function logout(req, res) {
    res.clearCookie('dew_session', { sameSite: 'lax', secure: false });
    res.json({ ok: true });
}

export function me(req, res) {
    res.json({ user: req.user });
}

export async function changePassword(req, res, next) {
    try {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body || {};

        if (!userId)
            return res.status(401).json({ message: 'Non autenticato' });

        if (!newPassword || newPassword.length < 8) {
            return res
                .status(400)
                .json({
                    message: 'La nuova password deve avere almeno 8 caratteri',
                });
        }

        // Prendo utente + hash
        const [rows] = await pool.query(
            `SELECT id, role, email, name, surname, status, password_hash
       FROM backoffice_users
       WHERE id = ?`,
            [userId],
        );
        const user = rows?.[0];
        if (!user)
            return res.status(404).json({ message: 'Utente non trovato' });

        if (user.status === 'suspended') {
            return res.status(403).json({ message: 'Utente sospeso' });
        }

        // Se vuoi obbligare l’old password (consigliato):
        if (!currentPassword) {
            return res
                .status(400)
                .json({ message: 'Password attuale obbligatoria' });
        }
        const ok = await bcrypt.compare(currentPassword, user.password_hash);
        if (!ok)
            return res
                .status(401)
                .json({ message: 'Password attuale non corretta' });

        const newHash = await bcrypt.hash(newPassword, 10);

        await pool.query(
            `UPDATE backoffice_users
       SET password_hash = ?, status = 'active'
       WHERE id = ?`,
            [newHash, userId],
        );

        // Rigenero cookie con status aggiornato
        const updatedPayload = {
            id: user.id,
            role: user.role,
            email: user.email,
            name: user.name,
            surname: user.surname,
            status: 'active',
        };
        signSessionCookie(res, updatedPayload);

        return res.json({
            user: {
                id: user.id,
                role: user.role,
                email: user.email,
                name: user.name,
                surname: user.surname,
                status: 'active',
            },
        });
    } catch (e) {
        next(e);
    }
}
