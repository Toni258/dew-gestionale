import { pool } from '../db/db.js';

export async function getFoods(req, res) {
    try {
        const { type, search = '' } = req.query;

        // VALIDAZIONE
        if (!type) {
            return res.status(400).json({
                error: 'Parametro "type" obbligatorio',
            });
        }

        const allowedTypes = ['primo', 'secondo', 'contorno', 'ultimo'];
        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                error: 'Tipo di piatto non validoo',
            });
        }

        // QUERY
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

export async function getFoodsAvailableForMenu(req, res) {
    try {
        const {
            type, // primo | secondo | contorno | ultimo
            season_type, // nome menu
            meal_type, // pranzo | cena
            search = '', // se in futuro voglio permettere la ricerca live uso search
            date_from = '',
            date_to = '',
            exclude_id_food = '',
        } = req.query;

        const excludeIdFood = Number(exclude_id_food) || 0;
        const useRange = date_from && date_to && date_to >= date_from;

        // VALIDAZIONE
        if (!type || !season_type || !meal_type) {
            return res.status(400).json({
                error: 'Parametri obbligatori: type, season_type, meal_type',
            });
        }

        const allowedTypes = [
            'primo',
            'secondo',
            'contorno',
            'ultimo',
            'coperto',
            'speciale',
        ];
        if (!allowedTypes.includes(type)) {
            return res
                .status(400)
                .json({ error: 'Tipo di piatto non validou' });
        }

        if (!['pranzo', 'cena'].includes(meal_type)) {
            return res.status(400).json({ error: 'Tipo pasto non valido' });
        }

        // QUERY
        const sql = `
            SELECT
                f.id_food,
                f.name,
                f.type,
                f.grammage_tot,
                f.kcal_tot,
                f.proteins,
                f.carbs,
                f.fats,
                f.allergy_notes
            FROM food f
            WHERE f.type = ?
            AND f.name LIKE ?
            AND (? = 0 OR f.id_food <> ?)

            -- 1) escludi piatti fissi già presenti nel menu
            AND NOT EXISTS (
                SELECT 1
                FROM dish_pairing dp
                JOIN meal m ON m.id_meal = dp.id_meal
                WHERE dp.id_food = f.id_food
                    AND dp.season_type = ?
                    AND dp.used = 1
                    AND m.type = ?
                    AND m.first_choice = 1
            )

            -- 2) escludi piatti sospesi (range se fornito, altrimenti oggi)
            AND NOT EXISTS (
                SELECT 1
                FROM food_availability fa
                WHERE fa.id_food = f.id_food
                    AND (
                    ${
                        useRange
                            ? 'NOT (? < fa.valid_from OR ? > fa.valid_to)'
                            : 'NOW() BETWEEN fa.valid_from AND fa.valid_to'
                    }
                    )
            )

            ORDER BY f.name ASC
        `;

        const params = useRange
            ? [
                  type,
                  `%${search}%`,
                  excludeIdFood,
                  excludeIdFood,
                  season_type,
                  meal_type,
                  date_to,
                  date_from,
              ]
            : [
                  type,
                  `%${search}%`,
                  excludeIdFood,
                  excludeIdFood,
                  season_type,
                  meal_type,
              ];

        const [rows] = await pool.query(sql, params);
        return res.json({ data: rows });
    } catch (err) {
        console.error('Errore getFoodsAvailableForMenu:', err);
        return res.status(500).json({
            error: 'Errore caricamento piatti',
        });
    }
}

export async function getCheeseFoods(req, res) {
    try {
        const CHEESE_IDS = [195, 196, 197];

        const [rows] = await pool.query(
            `
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
            WHERE id_food IN (?)
            ORDER BY FIELD(id_food, 195, 196, 197)
            `,
            [CHEESE_IDS],
        );

        return res.json({ data: rows });
    } catch (err) {
        console.error('Errore getCheeseFoods:', err);
        return res.status(500).json({ error: 'Errore caricamento formaggi' });
    }
}
