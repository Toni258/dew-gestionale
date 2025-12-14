import { pool } from '../db/db.js';

export async function getFilteredDishes(req, res) {
    try {
        const {
            search = '',
            stato = '',
            tipologia = '',
            page = '1',
            pageSize = '30',
        } = req.query;

        // allergeni può arrivare come: allergeni[]=uova&allergeni[]=latte
        let allergeni = req.query.allergeni ?? [];
        if (!Array.isArray(allergeni)) allergeni = [allergeni];
        allergeni = allergeni.filter(Boolean);

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const sizeNum = Math.min(
            100,
            Math.max(1, parseInt(pageSize, 10) || 30)
        );
        const offset = (pageNum - 1) * sizeNum;

        // Colonne richieste
        const selectCols = `
            name, type, grammage_tot, kcal_tot, proteins, carbs, fats, allergy_notes
        `;

        // Base WHERE
        let where = ` WHERE 1=1 `;
        const params = [];

        // NOME
        if (search.trim()) {
            where += ` AND name LIKE ? `;
            params.push(`%${search.trim()}%`);
        }

        // STATO (se esiste davvero la colonna)
        if (stato) {
            where += ` AND status = ? `;
            params.push(stato);
        }

        // TIPOLOGIA
        if (tipologia) {
            where += ` AND type = ? `;
            params.push(tipologia);
        }

        // ALLERGENI ESCLUSI: se allergy_notes contiene uno degli allergeni -> lo escludo
        // (se la tua logica è diversa, adattiamo)
        for (const a of allergeni) {
            where += ` AND (allergy_notes IS NULL OR allergy_notes NOT LIKE ?) `;
            params.push(`%${a}%`);
        }

        // 1) COUNT totale (per paginazione)
        const countSql = `SELECT COUNT(*) AS total FROM food ${where}`;
        const [countRows] = await pool.query(countSql, params);
        const total = countRows?.[0]?.total ?? 0;

        // 2) Riga dati paginata
        const dataSql = `
            SELECT ${selectCols}
            FROM food
            ${where}
            ORDER BY name ASC
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

export async function getFirstMeals(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM food LIMIT 5');

        res.json(rows);
    } catch (err) {
        console.error('Errore DB:', err);
        res.status(500).json({ error: 'Errore database' });
    }
}
