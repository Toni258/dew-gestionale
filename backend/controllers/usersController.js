import { pool } from '../db/db.js';
import path from 'path';
import fs from 'fs/promises';

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
                c.acceptance_time
            
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
