import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function requireAuth(req, res, next) {
    const token = req.cookies?.dew_session;
    if (!token) return res.status(401).json({ message: 'Non autenticato' });

    try {
        const payload = jwt.verify(token, JWT_SECRET);

        // se admin sospende un utente dopo il login, lo blocchi comunque
        if (payload?.status === 'suspended') {
            res.clearCookie('dew_session', { sameSite: 'lax', secure: false });
            return res.status(403).json({ message: 'Utente sospeso' });
        }

        req.user = payload; // { id, role, name, surname, email }
        next();
    } catch {
        return res.status(401).json({ message: 'Sessione non valida' });
    }
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: 'Non autenticato' });
        if (!roles.includes(req.user.role))
            return res.status(403).json({ message: 'Permessi insufficienti' });
        next();
    };
}

export function signSessionCookie(res, userPayload) {
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '8h' });

    res.cookie('dew_session', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // in produzione -> true (https)
        maxAge: 8 * 60 * 60 * 1000, // 8h
    });
}
