import { pool } from '../db/db.js';

/* Lista menù */
export async function getMenus(req, res) {
    try {
        const [rows] = await pool.query(`
            SELECT
            s.season_type,
            DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(s.end_date,   '%Y-%m-%d') AS end_date,

            (s.day_index + 1) AS day_number,

            CONCAT(
                DATE_FORMAT(s.start_date, '%d.%m.%Y'),
                ' - ',
                DATE_FORMAT(s.end_date,   '%d.%m.%Y')
            ) AS period_label,

            YEAR(s.start_date) AS start_year,

            CASE
                WHEN CURDATE() BETWEEN s.start_date AND s.end_date THEN 1
                ELSE 0
            END AS is_active,

            56 AS meals_total,

            COALESCE(cm.meals_completed, 0) AS meals_completed

        FROM season s

        LEFT JOIN (
            /* === conteggio pasti COMPLETI per menù === */
            SELECT
                x.season_type,
                SUM(
                    CASE
                        WHEN x.distinct_types >= 4 THEN 1
                        ELSE 0
                    END
                ) AS meals_completed
            FROM (
                /* === verifica che ogni meal abbia 4 TIPI DISTINTI === */
                SELECT
                    dp.season_type,
                    dp.id_meal,
                    COUNT(DISTINCT f.type) AS distinct_types
                FROM dish_pairing dp
                JOIN meal m
                    ON m.id_meal = dp.id_meal
                JOIN food f
                    ON f.id_food = dp.id_food
                WHERE m.first_choice = 0
                AND dp.used = 1
                GROUP BY dp.season_type, dp.id_meal
            ) x
            GROUP BY x.season_type
        ) cm
            ON cm.season_type = s.season_type

        ORDER BY s.start_date ASC;
        `);

        return res.json({ data: rows });
    } catch (err) {
        console.error('Errore getMenus:', err);
        return res.status(500).json({ error: 'Errore interno al server' });
    }
}

/* Controlla se esiste già un season_type (case-insensitive, spazi normalizzati) */
export async function checkMenuName(req, res) {
    try {
        const name = (req.query.name ?? '').trim();
        const excludeName = (req.query.excludeName ?? '').trim();

        if (!name) return res.json({ exists: false });

        const normalized = name.replace(/\s+/g, ' ').toLowerCase();
        const params = [normalized];

        let sql = `
            SELECT 1
            FROM season
            WHERE LOWER(TRIM(season_type)) = ?
        `;

        if (excludeName) {
            const exNorm = excludeName.replace(/\s+/g, ' ').toLowerCase();
            sql += ` AND LOWER(TRIM(season_type)) <> ?`;
            params.push(exNorm);
        }

        sql += ` LIMIT 1`;

        const [rows] = await pool.query(sql, params);
        return res.json({ exists: rows.length > 0 });
    } catch (err) {
        console.error('Errore checkMenuName:', err);
        return res.status(500).json({ error: 'Errore interno al server' });
    }
}

// Controlla se l'intervallo [start_date, end_date] si sovrappone a qualsiasi season esistente
export async function checkMenuDatesOverlap(req, res) {
    try {
        const start_date = (req.query.start_date ?? '').trim();
        const end_date = (req.query.end_date ?? '').trim();
        const excludeName = (req.query.excludeName ?? '').trim(); // opzionale (utile in edit)

        if (!start_date || !end_date) return res.json({ overlap: false });
        if (end_date < start_date) return res.json({ overlap: false }); // la validazione la fai già lato form

        // Overlap se: NON (newEnd < existingStart OR newStart > existingEnd)
        let sql = `
            SELECT season_type
            FROM season
            WHERE NOT (? < start_date OR ? > end_date)
        `;

        const params = [end_date, start_date];

        // escludi un menu specifico (per pagina modifica)
        if (excludeName) {
            sql += ` AND season_type <> ? `;
            params.push(excludeName);
        }

        sql += `
            ORDER BY start_date ASC
            LIMIT 1
        `;

        const [rows] = await pool.query(sql, params);

        if (rows.length === 0) return res.json({ overlap: false });

        return res.json({
            overlap: true,
            season_type: rows[0].season_type,
        });
    } catch (err) {
        console.error('Errore checkMenuDatesOverlap:', err);
        return res.status(500).json({ error: 'Errore interno al server' });
    }
}

/* Recupera un menu per season_type */
export async function getMenuBySeasonType(req, res) {
    try {
        const seasonType = decodeURIComponent(
            req.params.season_type ?? ''
        ).trim();
        if (!seasonType) {
            return res.status(400).json({ error: 'season_type non valido' });
        }

        const [rows] = await pool.query(
            `
            SELECT
                season_type,
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(end_date, '%Y-%m-%d')   AS end_date,
                day_index
            FROM season
            WHERE season_type = ?
            LIMIT 1
            `,
            [seasonType]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Menù non trovato' });
        }

        return res.json(rows[0]);
    } catch (err) {
        console.error('Errore getMenuBySeasonType:', err);
        return res.status(500).json({ error: 'Errore interno' });
    }
}

/*
  Ritorna la lista pasti (56) del menù:
  - solo meal.first_choice = 0 (piatti del giorno)
  - is_completed = 1 se per quel meal ci sono 4 dish_pairing nel menù
*/
export async function getMenuMealsStatus(req, res) {
    try {
        const seasonType = decodeURIComponent(
            req.params.season_type ?? ''
        ).trim();

        if (!seasonType) {
            return res.status(400).json({ error: 'season_type non valido' });
        }

        const [rows] = await pool.query(
            `
            SELECT
                m.day_index,
                m.type,

                COALESCE(dp_cnt.distinct_types, 0) AS distinct_types,

                CASE
                    WHEN COALESCE(dp_cnt.distinct_types, 0) >= 4 THEN 1
                    ELSE 0
                END AS is_completed

            FROM meal m

            LEFT JOIN (
                SELECT
                    dp.id_meal,
                    COUNT(DISTINCT f.type) AS distinct_types
                FROM dish_pairing dp
                JOIN food f ON f.id_food = dp.id_food
                WHERE dp.season_type = ?
                  AND dp.used = 1
                GROUP BY dp.id_meal
            ) dp_cnt ON dp_cnt.id_meal = m.id_meal

            WHERE m.first_choice = 0
              AND m.day_index BETWEEN 0 AND 27

            ORDER BY
                m.day_index ASC,
                FIELD(m.type, 'pranzo', 'cena') ASC
            `,
            [seasonType]
        );

        return res.json({ data: rows });
    } catch (err) {
        console.error('Errore getMenuMealsStatus:', err);
        return res.status(500).json({ error: 'Errore interno al server' });
    }
}

/* Crea un nuovo menu (season) */
export async function createMenu(req, res) {
    try {
        const name = (req.body.name ?? '').trim();
        const start_date = (req.body.start_date ?? '').trim();
        const end_date = (req.body.end_date ?? '').trim();

        if (!name || name.length < 3) {
            return res.status(400).json({ error: 'Nome non valido' });
        }
        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Date non valide' });
        }
        if (end_date < start_date) {
            return res.status(400).json({
                error: 'La data fine deve essere >= data inizio',
            });
        }

        const sql = `
            INSERT INTO season (season_type, start_date, end_date, day_index)
            VALUES (?, ?, ?, 0)
        `;

        await pool.query(sql, [name, start_date, end_date]);

        return res.status(201).json({ success: true });
    } catch (err) {
        console.error('Errore createMenu:', err);

        if (err?.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Nome menù già esistente' });
        }

        return res.status(500).json({ error: 'Errore creazione menù' });
    }
}

/* Aggiorna un menu (se serve in futuro) */
export async function updateMenu(req, res) {
    try {
        const seasonType = decodeURIComponent(
            req.params.season_type ?? ''
        ).trim();

        if (!seasonType) {
            return res.status(400).json({ error: 'season_type non valido' });
        }

        const start_date = (req.body.start_date ?? '').trim();
        const end_date = (req.body.end_date ?? '').trim();
        const day_index = Number(req.body.day_index);

        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Date non valide' });
        }
        if (end_date < start_date) {
            return res.status(400).json({
                error: 'La data fine deve essere >= data inizio',
            });
        }
        if (!Number.isInteger(day_index) || day_index < 0 || day_index > 27) {
            return res.status(400).json({ error: 'day_index non valido' });
        }

        // overlap: escludo il menu corrente
        const [ov] = await pool.query(
            `
            SELECT season_type
            FROM season
            WHERE season_type <> ?
              AND NOT (? < start_date OR ? > end_date)
            LIMIT 1
            `,
            [seasonType, end_date, start_date]
        );

        if (ov.length > 0) {
            return res.status(409).json({
                error: `Intervallo già usato nel menù "${ov[0].season_type}"`,
                season_type: ov[0].season_type,
            });
        }

        const [result] = await pool.query(
            `
            UPDATE season
            SET start_date = ?, end_date = ?, day_index = ?
            WHERE season_type = ?
            `,
            [start_date, end_date, day_index, seasonType]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Menù non trovato' });
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('Errore updateMenu:', err);
        return res.status(500).json({ error: 'Errore aggiornamento menù' });
    }
}

/* Elimina definitivamente un menu e tutti i suoi dish_pairing (operazione transazionale e atomica) */
export async function deleteMenu(req, res) {
    const conn = await pool.getConnection();

    try {
        const seasonType = decodeURIComponent(
            req.params.season_type ?? ''
        ).trim();

        if (!seasonType) {
            return res.status(400).json({ error: 'season_type non valido' });
        }

        await conn.beginTransaction();

        // 1) elimina dish_pairing
        await conn.query(`DELETE FROM dish_pairing WHERE season_type = ?`, [
            seasonType,
        ]);

        // 2) elimina menu
        const [result] = await conn.query(
            `DELETE FROM season WHERE season_type = ?`,
            [seasonType]
        );

        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Menù non trovato' });
        }

        await conn.commit();
        return res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        console.error('Errore deleteMenu:', err);
        return res.status(500).json({ error: 'Errore eliminazione menù' });
    } finally {
        conn.release();
    }
}

export async function getMenuMealComposition(req, res) {
    try {
        const seasonType = decodeURIComponent(
            req.params.season_type ?? ''
        ).trim();

        const day_index = Number(req.params.day_index);
        const meal_type = req.params.meal_type;

        if (!seasonType || !Number.isInteger(day_index)) {
            return res.status(400).json({ error: 'Parametri non validi' });
        }

        if (!['pranzo', 'cena'].includes(meal_type)) {
            return res.status(400).json({ error: 'Tipo pasto non valido' });
        }

        const [rows] = await pool.query(
            `
            SELECT
                dp.id_dish_pairing,
                dp.used,

                f.id_food,
                f.name,
                f.type,
                f.grammage_tot,
                f.kcal_tot,
                f.proteins,
                f.carbs,
                f.fats,
                f.allergy_notes

            FROM dish_pairing dp

            JOIN meal m
              ON m.id_meal = dp.id_meal

            JOIN food f
              ON f.id_food = dp.id_food

            WHERE dp.season_type = ?
              AND m.day_index = ?
              AND m.type = ?
              AND m.first_choice = 0

            ORDER BY dp.id_dish_pairing ASC
            `,
            [seasonType, day_index, meal_type]
        );

        return res.json({
            season_type: seasonType,
            day_index,
            meal_type,
            dishes: rows,
        });
    } catch (err) {
        console.error('Errore getMenuMealComposition:', err);
        return res.status(500).json({ error: 'Errore interno' });
    }
}

// Cancella tutti i dish_pairing del giorno/pasto selezionato e scrive i nuovi dish_pairing
export async function upsertMenuMealComposition(req, res) {
    const seasonType = decodeURIComponent(req.params.season_type ?? '').trim();
    const dayIndex = Number(req.params.day_index);
    const mealType = String(req.params.meal_type ?? '')
        .trim()
        .toLowerCase();

    try {
        if (!seasonType) {
            return res.status(400).json({ error: 'season_type non valido' });
        }
        if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 27) {
            return res.status(400).json({ error: 'day_index non valido' });
        }
        if (!['pranzo', 'cena'].includes(mealType)) {
            return res.status(400).json({ error: 'meal_type non valido' });
        }

        const foods = req.body?.foods ?? req.body;
        const requiredKeys = ['primo', 'secondo', 'contorno', 'ultimo'];

        for (const k of requiredKeys) {
            if (!foods?.[k]) {
                return res.status(400).json({ error: `Campo mancante: ${k}` });
            }
        }

        const ids = requiredKeys.map((k) => Number(foods[k]));
        if (ids.some((x) => !Number.isInteger(x) || x <= 0)) {
            return res.status(400).json({ error: 'id_food non validi' });
        }

        // opzionale: evita duplicati (stesso id_food selezionato 2 volte)
        const unique = new Set(ids);
        if (unique.size !== ids.length) {
            return res
                .status(400)
                .json({ error: 'Hai selezionato lo stesso piatto più volte' });
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Verifica che il menu esista
            const [seasonRows] = await conn.query(
                `SELECT 1 FROM season WHERE season_type = ? LIMIT 1`,
                [seasonType]
            );
            if (seasonRows.length === 0) {
                await conn.rollback();
                return res.status(404).json({ error: 'Menù non trovato' });
            }

            // Trova id_meal per quel day_index + type + first_choice=0
            const [mealRows] = await conn.query(
                `
          SELECT id_meal
          FROM meal
          WHERE day_index = ?
            AND type = ?
            AND first_choice = 0
          LIMIT 1
        `,
                [dayIndex, mealType]
            );
            if (mealRows.length === 0) {
                await conn.rollback();
                return res.status(404).json({ error: 'Meal non trovato' });
            }
            const idMeal = mealRows[0].id_meal;

            // Cancella eventuale composizione precedente (used=1)
            await conn.query(
                `DELETE FROM dish_pairing WHERE season_type = ? AND id_meal = ? AND used = 1`,
                [seasonType, idMeal]
            );

            // Inserisci i 4 piatti
            const values = ids.map((idFood) => [idMeal, idFood, seasonType, 1]);
            await conn.query(
                `INSERT INTO dish_pairing (id_meal, id_food, season_type, used) VALUES ?`,
                [values]
            );

            await conn.commit();
            return res.json({ ok: true });
        } catch (e) {
            await conn.rollback();
            console.error('Errore upsertMenuMealComposition:', e);
            return res
                .status(500)
                .json({ error: 'Errore salvataggio composizione pasto' });
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error('Errore upsertMenuMealComposition:', err);
        return res.status(500).json({ error: 'Errore interno al server' });
    }
}
