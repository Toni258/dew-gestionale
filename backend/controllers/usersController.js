import { pool } from '../db/db.js';
import path from 'path';
import fs from 'fs/promises';

export async function getFilteredUsers(req, res) {
    try {
        const {
            search = '',
            ruolo = '',
            page = '1',
            pageSize = '30',
        } = req.query;

        let allergeni = req.query.allergeni ?? [];
        if (!Array.isArray(allergeni)) allergeni = [allergeni];
        allergeni = allergeni.filter(Boolean);

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
            where += ` AND f.name LIKE ? `;
            params.push(`%${search.trim()}%`);
        }

        if (tipologia) {
            where += ` AND f.type = ? `;
            params.push(tipologia);
        }

        if (stato === 'sospeso') {
            where += ` AND susp.id_food IS NOT NULL `;
        }

        if (stato === 'attivo') {
            where += `
                AND susp.id_food IS NULL
                AND act.id_food IS NOT NULL
            `;
        }

        if (stato === 'non_attivo') {
            where += `
                AND susp.id_food IS NULL
                AND act.id_food IS NULL
            `;
        }

        for (const a of allergeni) {
            where += ` AND (f.allergy_notes IS NULL OR f.allergy_notes NOT LIKE ?) `;
            params.push(`%${a}%`);
        }

        // ===============================
        // QUERY BASE CON STATO CALCOLATO
        // ===============================
        const baseQuery = `
            FROM food f

            -- SOSPESI oggi (1 riga per id_food)
            LEFT JOIN (
                SELECT DISTINCT id_food
                FROM food_availability
                WHERE NOW() BETWEEN valid_from AND valid_to
            ) susp
                ON susp.id_food = f.id_food

            -- ATTIVI oggi (1 riga per id_food)
            LEFT JOIN (
                SELECT DISTINCT dp.id_food
                FROM dish_pairing dp
                JOIN season s
                    ON s.season_type = dp.season_type
                AND NOW() BETWEEN s.start_date AND s.end_date
                WHERE dp.used = 1
            ) act
                ON act.id_food = f.id_food
        `;

        // ===============================
        // COUNT
        // ===============================
        const countSql = `
            SELECT COUNT(DISTINCT f.id_food) AS total
            ${baseQuery}
            ${where}
        `;

        const [countRows] = await pool.query(countSql, params);
        const total = countRows[0]?.total ?? 0;

        // ===============================
        // DATA
        // ===============================
        const dataSql = `
            SELECT
                f.id_food,
                f.name,
                f.type,
                f.grammage_tot,
                f.kcal_tot,
                f.proteins,
                f.carbs,
                f.fats,
                f.allergy_notes,

                CASE
                    WHEN susp.id_food IS NOT NULL THEN 'sospeso'
                    WHEN act.id_food IS NOT NULL THEN 'attivo'
                    ELSE 'non_attivo'
                END AS status

            ${baseQuery}
            ${where}

            ORDER BY f.name ASC
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
