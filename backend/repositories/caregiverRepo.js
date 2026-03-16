// Database queries used for caregiver.
import { APP_USER_DISABLE_SENTINEL } from '../../shared/constants.js';

// Builds the data needed for list where.
function buildListWhere({ search = '', role = '' } = {}) {
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

    return { where, params };
}

// Returns the list used by caregivers.
export async function listCaregivers(
    poolOrConn,
    { search = '', role = '', page = 1, pageSize = 30 } = {},
) {
    const { where, params } = buildListWhere({ search, role });
    const limit = Math.min(100, Math.max(1, Number(pageSize) || 30));
    const offset = (Math.max(1, Number(page) || 1) - 1) * limit;

    const [rows] = await poolOrConn.query(
        `
            SELECT
                id_caregiver,
                email,
                name,
                surname,
                role,
                acceptance_time,
                acceptance_ip,
                (password_hash = ?) AS is_disabled
            FROM caregiver
            ${where}
            ORDER BY id_caregiver ASC
            LIMIT ? OFFSET ?
        `,
        [APP_USER_DISABLE_SENTINEL, ...params, limit, offset],
    );

    return rows;
}

// Returns the count for caregivers.
export async function countCaregivers(poolOrConn, { search = '', role = '' } = {}) {
    const { where, params } = buildListWhere({ search, role });
    const [rows] = await poolOrConn.query(
        `
            SELECT COUNT(DISTINCT id_caregiver) AS total
            FROM caregiver
            ${where}
        `,
        params,
    );

    return Number(rows[0]?.total ?? 0);
}

// Finds the data for caregiver by id.
export async function findCaregiverById(poolOrConn, caregiverId) {
    const [rows] = await poolOrConn.query(
        `
            SELECT
                id_caregiver,
                email,
                name,
                surname,
                role,
                acceptance_time,
                acceptance_ip,
                password_hash
            FROM caregiver
            WHERE id_caregiver = ?
            LIMIT 1
        `,
        [caregiverId],
    );

    return rows[0] ?? null;
}

// Helper function used by caregiver email exists.
export async function caregiverEmailExists(
    poolOrConn,
    email,
    { excludeCaregiverId } = {},
) {
    const params = [email];
    let sql = `SELECT 1 FROM caregiver WHERE email = ?`;

    if (excludeCaregiverId) {
        sql += ' AND id_caregiver <> ?';
        params.push(excludeCaregiverId);
    }

    sql += ' LIMIT 1';

    const [rows] = await poolOrConn.query(sql, params);
    return rows.length > 0;
}

// Updates the data for caregiver info.
export async function updateCaregiverInfo(
    poolOrConn,
    { caregiverId, name, surname, email, role },
) {
    const [result] = await poolOrConn.query(
        `
            UPDATE caregiver
            SET name = ?, surname = ?, email = ?, role = ?
            WHERE id_caregiver = ?
        `,
        [name, surname, email, role, caregiverId],
    );

    return result.affectedRows ?? 0;
}

// Disables the data used by caregiver.
export async function disableCaregiver(poolOrConn, caregiverId) {
    const [result] = await poolOrConn.query(
        `
            UPDATE caregiver
            SET password_hash = ?
            WHERE id_caregiver = ?
        `,
        [APP_USER_DISABLE_SENTINEL, caregiverId],
    );

    return result.affectedRows ?? 0;
}

// Deletes the data for caregiver.
export async function deleteCaregiver(poolOrConn, caregiverId) {
    const [result] = await poolOrConn.query(
        `DELETE FROM caregiver WHERE id_caregiver = ?`,
        [caregiverId],
    );

    return result.affectedRows ?? 0;
}