// Database queries used for backoffice users.
const BASE_COLUMNS = `
    id,
    role,
    email,
    name,
    surname,
    status,
    password_hash,
    last_login_at,
    created_at,
    updated_at
`;

// Builds the data needed for list where.
function buildListWhere({ search = '', role = '', status = '' } = {}) {
    let where = ' WHERE 1=1 ';
    const params = [];

    if (String(search).trim()) {
        const term = `%${String(search).trim()}%`;
        where += ' AND (name LIKE ? OR surname LIKE ?)';
        params.push(term, term);
    }

    if (String(role).trim()) {
        where += ' AND role = ? ';
        params.push(String(role).trim());
    }

    if (String(status).trim()) {
        where += ' AND status = ? ';
        params.push(String(status).trim());
    }

    return { where, params };
}

// Finds the data for backoffice user by id.
export async function findBackofficeUserById(poolOrConn, userId) {
    const [rows] = await poolOrConn.query(
        `
            SELECT ${BASE_COLUMNS}
            FROM backoffice_users
            WHERE id = ?
            LIMIT 1
        `,
        [userId],
    );

    return rows[0] ?? null;
}

// Finds the data for backoffice user by email.
export async function findBackofficeUserByEmail(poolOrConn, email) {
    const [rows] = await poolOrConn.query(
        `
            SELECT ${BASE_COLUMNS}
            FROM backoffice_users
            WHERE email = ?
            LIMIT 1
        `,
        [email],
    );

    return rows[0] ?? null;
}

// Updates the data for backoffice user last login at.
export async function updateBackofficeUserLastLoginAt(poolOrConn, userId) {
    await poolOrConn.query(
        `UPDATE backoffice_users SET last_login_at = NOW() WHERE id = ?`,
        [userId],
    );
}

// Updates the data for backoffice user password and status.
export async function updateBackofficeUserPasswordAndStatus(
    poolOrConn,
    { userId, passwordHash, status },
) {
    await poolOrConn.query(
        `
            UPDATE backoffice_users
            SET password_hash = ?, status = ?, updated_at = NOW()
            WHERE id = ?
        `,
        [passwordHash, status, userId],
    );
}

// Helper function used by mark backoffice user password reset requested.
export async function markBackofficeUserPasswordResetRequested(
    poolOrConn,
    userId,
) {
    await poolOrConn.query(
        `
            UPDATE backoffice_users
            SET status = 'password_reset_requested', updated_at = NOW()
            WHERE id = ?
        `,
        [userId],
    );
}

// Returns the list used by backoffice users.
export async function listBackofficeUsers(
    poolOrConn,
    { search = '', role = '', status = '', page = 1, pageSize = 30 } = {},
) {
    const { where, params } = buildListWhere({ search, role, status });
    const limit = Math.min(100, Math.max(1, Number(pageSize) || 30));
    const offset = (Math.max(1, Number(page) || 1) - 1) * limit;

    const [rows] = await poolOrConn.query(
        `
            SELECT
                id,
                email,
                name,
                surname,
                role,
                status,
                last_login_at,
                created_at,
                updated_at
            FROM backoffice_users
            ${where}
            ORDER BY
                CASE
                    WHEN status = 'password_reset_requested' THEN 0
                    WHEN role = 'super_user' THEN 1
                    ELSE 2
                END,
                id ASC
            LIMIT ? OFFSET ?
        `,
        [...params, limit, offset],
    );

    return rows;
}

// Returns the count for backoffice users.
export async function countBackofficeUsers(
    poolOrConn,
    { search = '', role = '', status = '' } = {},
) {
    const { where, params } = buildListWhere({ search, role, status });
    const [rows] = await poolOrConn.query(
        `
            SELECT COUNT(DISTINCT id) AS total
            FROM backoffice_users
            ${where}
        `,
        params,
    );

    return Number(rows[0]?.total ?? 0);
}

// Updates the data for backoffice user status.
export async function updateBackofficeUserStatus(poolOrConn, { userId, status }) {
    const [result] = await poolOrConn.query(
        `
            UPDATE backoffice_users
            SET status = ?, updated_at = NOW()
            WHERE id = ?
        `,
        [status, userId],
    );

    return result.affectedRows ?? 0;
}

// Updates the data for backoffice user info.
export async function updateBackofficeUserInfo(
    poolOrConn,
    { userId, name, surname, email, role },
) {
    const [result] = await poolOrConn.query(
        `
            UPDATE backoffice_users
            SET name = ?, surname = ?, email = ?, role = ?, updated_at = NOW()
            WHERE id = ?
        `,
        [name, surname, email, role, userId],
    );

    return result.affectedRows ?? 0;
}

// Deletes the data for backoffice user.
export async function deleteBackofficeUser(poolOrConn, userId) {
    const [result] = await poolOrConn.query(
        `DELETE FROM backoffice_users WHERE id = ?`,
        [userId],
    );

    return result.affectedRows ?? 0;
}

// Helper function used by backoffice email exists.
export async function backofficeEmailExists(
    poolOrConn,
    email,
    { excludeUserId } = {},
) {
    const params = [email];
    let sql = `SELECT 1 FROM backoffice_users WHERE LOWER(email) = ?`;

    if (excludeUserId) {
        sql += ' AND id <> ?';
        params.push(excludeUserId);
    }

    sql += ' LIMIT 1';

    const [rows] = await poolOrConn.query(sql, params);
    return rows.length > 0;
}

// Creates the data for backoffice user.
export async function createBackofficeUser(
    poolOrConn,
    { email, passwordHash, name, surname, role },
) {
    const [result] = await poolOrConn.query(
        `
            INSERT INTO backoffice_users (
                email,
                password_hash,
                name,
                surname,
                role,
                status,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, 'must_change_password', NOW(), NOW())
        `,
        [email, passwordHash, name, surname, role],
    );

    return result.insertId;
}