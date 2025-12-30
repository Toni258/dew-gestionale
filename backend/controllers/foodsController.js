import { pool } from '../db/db.js';

export async function getFoods(req, res) {
    try {
        const { type, search = '' } = req.query;

        // ==========================
        // VALIDAZIONE
        // ==========================
        if (!type) {
            return res.status(400).json({
                error: 'Parametro "type" obbligatorio',
            });
        }

        const allowedTypes = ['primo', 'secondo', 'contorno', 'ultimo'];
        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                error: 'Tipo di piatto non valido',
            });
        }

        // ==========================
        // QUERY
        // ==========================
        const sql = `
            SELECT
                id_food,
                name,
                type,
                grammage_tot,
                kcal_tot,
                proteins,
                carbs,
                fats,
                allergy_notes
            FROM food
            WHERE type = ?
              AND name LIKE ?
            ORDER BY name ASC
        `;

        const params = [type, `%${search}%`];

        const [rows] = await pool.query(sql, params);

        res.json({
            data: rows,
        });
    } catch (err) {
        console.error('Errore getFoods:', err);
        res.status(500).json({
            error: 'Errore caricamento piatti',
        });
    }
}
