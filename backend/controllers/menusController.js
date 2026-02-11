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
                y.season_type,
                SUM(
                    CASE
                        WHEN
                            y.has_primo = 1
                        AND y.has_secondo = 1
                        AND y.has_contorno = 1
                        AND y.has_ultimo = 1
                        THEN 1
                        ELSE 0
                    END
                ) AS meals_completed
            FROM (
                /* === verifica presenza dei 4 tipi per ogni meal === */
                SELECT
                    dp.season_type,
                    dp.id_meal,

                    MAX(f.type = 'primo')    AS has_primo,
                    MAX(f.type = 'secondo') AS has_secondo,
                    MAX(f.type = 'contorno') AS has_contorno,
                    MAX(f.type = 'ultimo')  AS has_ultimo

                FROM dish_pairing dp
                JOIN meal m
                    ON m.id_meal = dp.id_meal
                JOIN food f
                    ON f.id_food = dp.id_food

                WHERE m.first_choice = 0
                AND dp.used = 1

                GROUP BY dp.season_type, dp.id_meal
            ) y
            GROUP BY y.season_type
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
            req.params.season_type ?? '',
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
            [seasonType],
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
  - is_completed = 1 se per quel meal ci sono 4 dish_pairing (primo, secondo, contorno e ultimo) nel menù
*/
export async function getMenuMealsStatus(req, res) {
    try {
        const seasonType = decodeURIComponent(
            req.params.season_type ?? '',
        ).trim();

        if (!seasonType) {
            return res.status(400).json({ error: 'season_type non valido' });
        }

        const [rows] = await pool.query(
            `
            SELECT
                m.day_index,
                m.type,

                /* === flag di presenza per tipo === */
                COALESCE(x.has_primo, 0)     AS has_primo,
                COALESCE(x.has_secondo, 0)  AS has_secondo,
                COALESCE(x.has_contorno, 0) AS has_contorno,
                COALESCE(x.has_ultimo, 0)   AS has_ultimo,

                /* === completo SOLO se tutti e 4 === */
                CASE
                    WHEN
                        COALESCE(x.has_primo, 0) = 1
                    AND COALESCE(x.has_secondo, 0) = 1
                    AND COALESCE(x.has_contorno, 0) = 1
                    AND COALESCE(x.has_ultimo, 0) = 1
                    THEN 1
                    ELSE 0
                END AS is_completed

            FROM meal m

            LEFT JOIN (
                SELECT
                    dp.id_meal,

                    MAX(f.type = 'primo')    AS has_primo,
                    MAX(f.type = 'secondo') AS has_secondo,
                    MAX(f.type = 'contorno') AS has_contorno,
                    MAX(f.type = 'ultimo')  AS has_ultimo

                FROM dish_pairing dp
                JOIN food f ON f.id_food = dp.id_food
                WHERE dp.season_type = ?
                  AND dp.used = 1
                GROUP BY dp.id_meal
            ) x ON x.id_meal = m.id_meal

            WHERE m.first_choice = 0
              AND m.day_index BETWEEN 0 AND 27

            ORDER BY
                m.day_index ASC,
                FIELD(m.type, 'pranzo', 'cena') ASC
            `,
            [seasonType],
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
            req.params.season_type ?? '',
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
            [seasonType, end_date, start_date],
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
            [start_date, end_date, day_index, seasonType],
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
            req.params.season_type ?? '',
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
            [seasonType],
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
            req.params.season_type ?? '',
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
                    f.allergy_notes,

                    /* === flag di completezza del pasto === */
                    stats.is_completed

                FROM dish_pairing dp

                JOIN meal m
                ON m.id_meal = dp.id_meal

                JOIN food f
                ON f.id_food = dp.id_food

                /* === subquery che valuta la completezza del meal === */
                JOIN (
                    SELECT
                        m2.id_meal,
                        CASE
                            WHEN
                                MAX(f2.type = 'primo')    = 1
                            AND MAX(f2.type = 'secondo') = 1
                            AND MAX(f2.type = 'contorno') = 1
                            AND MAX(f2.type = 'ultimo')  = 1
                            THEN 1
                            ELSE 0
                        END AS is_completed
                    FROM dish_pairing dp2
                    JOIN meal m2
                        ON m2.id_meal = dp2.id_meal
                    JOIN food f2
                        ON f2.id_food = dp2.id_food
                    WHERE dp2.season_type = ?
                    AND m2.day_index = ?
                    AND m2.type = ?
                    AND m2.first_choice = 0
                    AND dp2.used = 1
                    GROUP BY m2.id_meal
                ) stats
                    ON stats.id_meal = m.id_meal

                WHERE dp.season_type = ?
                AND m.day_index = ?
                AND m.type = ?
                AND m.first_choice = 0
                AND dp.used = 1

                ORDER BY dp.id_dish_pairing ASC
            `,
            [
                seasonType,
                day_index,
                meal_type,
                seasonType,
                day_index,
                meal_type,
            ],
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

        // evita duplicati (stesso id_food selezionato 2 volte)
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
                [seasonType],
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
                [dayIndex, mealType],
            );
            if (mealRows.length === 0) {
                await conn.rollback();
                return res.status(404).json({ error: 'Meal non trovato' });
            }
            const idMeal = mealRows[0].id_meal;

            // Cancella eventuale composizione precedente (ma NON il coperto)
            await conn.query(
                `   DELETE dp
                    FROM dish_pairing dp
                    JOIN food f ON f.id_food = dp.id_food
                    WHERE dp.season_type = ?
                        AND dp.id_meal = ?
                        AND f.type <> 'coperto';
                `,
                [seasonType, idMeal],
            );

            // Inserisci i 4 piatti
            const values = ids.map((idFood) => [idMeal, idFood, seasonType, 1]);
            await conn.query(
                `INSERT INTO dish_pairing (id_meal, id_food, season_type, used) VALUES ?`,
                [values],
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

// Piatti fissi (first_choice = 1) di un menù (season_type)
export async function getMenuFixedDishes(req, res) {
    try {
        const seasonType = req.params.season_type;

        const [rows] = await pool.query(
            `
            SELECT 
                f.id_food,
                m.type AS pasto,
                f.name,
                f.type AS portata,
                f.grammage_tot,
                f.kcal_tot,
                f.proteins,
                f.carbs,
                f.fats,
                COUNT(*) AS ripetizioni
            FROM dish_pairing dp 
            JOIN meal m ON m.id_meal = dp.id_meal
            JOIN food f ON f.id_food = dp.id_food
            WHERE dp.season_type = ?
                AND dp.used = 1
                AND (m.first_choice = 1 OR f.type = "coperto")
            GROUP BY f.id_food, m.type
            ORDER BY FIELD(m.type, 'pranzo', 'cena'), f.type, ripetizioni DESC;
            `,
            [seasonType],
        );

        return res.json({ data: rows });
    } catch (err) {
        console.error('Errore getMenuFixedDishes:', err);
        return res.status(500).json({ error: 'Errore interno al server' });
    }
}

// Salva PIATTI FISSI (meal.first_choice = 1) di un menù (season_type)
// - Cancella tutte le righe dish_pairing per i meal first_choice=1 di quel season_type
// - Inserisce di nuovo tutte le righe, replicandole per 28 giorni
export async function upsertMenuFixedDishes(req, res) {
    const seasonType = decodeURIComponent(req.params.season_type ?? '').trim();

    try {
        if (!seasonType) {
            return res.status(400).json({ error: 'season_type non valido' });
        }

        // Body atteso:
        // {
        //   pranzo: { primo:[...], secondo:[...], contorno:[...], ultimo:[...], coperto:[...] },
        //   cena:   { primo:[...], secondo:[...], contorno:[...], ultimo:[...], coperto:[...], speciale:[...] }
        // }
        const body = req.body ?? {};
        const pranzo = body.pranzo ?? {};
        const cena = body.cena ?? {};

        const formaggi_rotation = body.formaggi_rotation ?? null;

        const CHEESE_IDS = [195, 196, 197];

        function validateCheeseRotation(rot) {
            if (!rot || typeof rot !== 'object')
                return 'FORMAGGI: blocco mancante';
            if (!Array.isArray(rot.pranzo) || rot.pranzo.length !== 7)
                return 'FORMAGGI: pranzo deve avere 7 elementi';
            if (!Array.isArray(rot.cena) || rot.cena.length !== 7)
                return 'FORMAGGI: cena deve avere 7 elementi';

            const all = [...rot.pranzo, ...rot.cena].map((x) => Number(x));
            if (all.some((n) => !Number.isInteger(n) || n <= 0))
                return 'FORMAGGI: valori non validi';
            if (all.some((n) => !CHEESE_IDS.includes(n)))
                return 'FORMAGGI: id non ammesso (usa solo 195/196/197)';

            return null;
        }

        const rotErr = validateCheeseRotation(formaggi_rotation);
        if (rotErr) return res.status(400).json({ error: rotErr });

        const requiredLunch = [
            'primo',
            'secondo',
            'contorno',
            'ultimo',
            'coperto',
        ];
        const requiredDinner = [
            'primo',
            'secondo',
            'contorno',
            'ultimo',
            'coperto',
            'speciale',
        ];

        // helper: da array di numeri/oggetti -> array di id_food (numeri)
        const toIds = (arr) => {
            if (!Array.isArray(arr)) return [];
            return arr
                .map((x) => {
                    // supporto sia [1,2,3] che [{id_food:1}, ...]
                    if (x && typeof x === 'object') return Number(x.id_food);
                    return Number(x);
                })
                .filter((n) => Number.isInteger(n) && n > 0);
        };

        // validazione presenza campi + che siano tutti pieni (nessun buco)
        // ECCEZIONE: "secondo" -> richiediamo SOLO i primi 2 (il terzo è opzionale)
        const validateBlock = (block, keys, label) => {
            for (const k of keys) {
                if (!Array.isArray(block[k])) {
                    return `${label}: campo "${k}" mancante o non valido`;
                }

                const ids = block[k].map((x) =>
                    x && typeof x === 'object' ? Number(x.id_food) : Number(x),
                );

                if (k === 'secondo') {
                    // devono esserci almeno 2 slot e i primi due devono essere validi
                    if (ids.length < 2) {
                        return `${label}: campo "secondo" incompleto (servono almeno 2 piatti)`;
                    }

                    const firstTwo = ids.slice(0, 2);
                    if (firstTwo.some((n) => !Number.isInteger(n) || n <= 0)) {
                        return `${label}: campo "secondo" incompleto (i primi 2 sono obbligatori)`;
                    }

                    // il terzo può essere 0/null/undefined -> NON bloccare
                    continue;
                }

                // per tutti gli altri campi: tutto obbligatorio
                if (ids.some((n) => !Number.isInteger(n) || n <= 0)) {
                    return `${label}: campo "${k}" incompleto`;
                }
            }
            return null;
        };

        const errLunch = validateBlock(pranzo, requiredLunch, 'PRANZO');
        if (errLunch) return res.status(400).json({ error: errLunch });

        const errDinner = validateBlock(cena, requiredDinner, 'CENA');
        if (errDinner) return res.status(400).json({ error: errDinner });

        // Normalizzo tutto in liste di id_food
        const idsLunch = {
            primo: toIds(pranzo.primo),
            secondo: toIds(pranzo.secondo),
            contorno: toIds(pranzo.contorno),
            ultimo: toIds(pranzo.ultimo),
            coperto: toIds(pranzo.coperto),
        };

        const idsDinner = {
            primo: toIds(cena.primo),
            secondo: toIds(cena.secondo),
            contorno: toIds(cena.contorno),
            ultimo: toIds(cena.ultimo),
            coperto: toIds(cena.coperto),
            speciale: toIds(cena.speciale),
        };

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // 0) verifica che il menu esista
            const [seasonRows] = await conn.query(
                `SELECT 1 FROM season WHERE season_type = ? LIMIT 1`,
                [seasonType],
            );
            if (seasonRows.length === 0) {
                await conn.rollback();
                return res.status(404).json({ error: 'Menù non trovato' });
            }

            // 1) meal fissi (first_choice=1) -> per tutti i piatti fissi TRANNE coperto
            const [fixedMeals] = await conn.query(
                `
                SELECT id_meal, day_index, type
                FROM meal
                WHERE first_choice = 1
                    AND day_index BETWEEN 0 AND 27
                ORDER BY day_index ASC, FIELD(type, 'pranzo','cena') ASC
                `,
            );

            // 1b) meal giornalieri (first_choice=0) -> SOLO per coperto
            const [dailyMeals] = await conn.query(
                `
                SELECT id_meal, day_index, type
                FROM meal
                WHERE first_choice = 0
                    AND day_index BETWEEN 0 AND 27
                ORDER BY day_index ASC, FIELD(type, 'pranzo','cena') ASC
                `,
            );

            if (fixedMeals.length === 0 || dailyMeals.length === 0) {
                await conn.rollback();
                return res
                    .status(500)
                    .json({ error: 'Tabella meal non popolata correttamente' });
            }

            // 2) DELETE: elimina tutti i pairing dei meal fissi (first_choice=1) per quel menu
            await conn.query(
                `
                DELETE FROM dish_pairing
                WHERE season_type = ?
                    AND id_meal IN (
                    SELECT id_meal
                    FROM meal
                    WHERE first_choice = 1
                        AND day_index BETWEEN 0 AND 27
                    )
                `,
                [seasonType],
            );

            // 2b) DELETE: elimina SOLO i coperti dai meal giornalieri (first_choice=0)
            await conn.query(
                `
                DELETE dp
                FROM dish_pairing dp
                JOIN food f ON f.id_food = dp.id_food
                WHERE dp.season_type = ?
                    AND f.type = 'coperto'
                    AND dp.id_meal IN (
                    SELECT id_meal
                    FROM meal
                    WHERE first_choice = 0
                        AND day_index BETWEEN 0 AND 27
                    )
                `,
                [seasonType],
            );

            // 3) INSERT: preparo righe nuove
            const values = [];

            // 3a) Inserisco i fissi (NO coperto) su fixedMeals
            for (const m of fixedMeals) {
                const isLunch = m.type === 'pranzo';
                const src = isLunch ? idsLunch : idsDinner;

                const allIdsNoCoperto = [
                    ...src.primo,
                    ...src.secondo.slice(0, 2),
                    ...src.contorno,
                    ...src.ultimo,
                    ...(isLunch ? [] : src.speciale),
                ];

                for (const idFood of allIdsNoCoperto) {
                    values.push([m.id_meal, idFood, seasonType, 1]);
                }

                // aggiungo formaggio “a rotazione” per quel giorno
                const weekday = Number(m.day_index) % 7; // 0..6
                const cheeseId =
                    m.type === 'pranzo'
                        ? Number(formaggi_rotation.pranzo[weekday])
                        : Number(formaggi_rotation.cena[weekday]);

                values.push([m.id_meal, cheeseId, seasonType, 1]);
            }

            // 3b) Inserisco coperto (1) su dailyMeals
            // payload: coperto è array, ma per te è 1 slot => prendo il primo
            const copertoLunchId = Number(idsLunch.coperto?.[0] ?? 0);
            const copertoDinnerId = Number(idsDinner.coperto?.[0] ?? 0);

            if (!Number.isInteger(copertoLunchId) || copertoLunchId <= 0) {
                await conn.rollback();
                return res
                    .status(400)
                    .json({ error: 'PRANZO: coperto non valido' });
            }
            if (!Number.isInteger(copertoDinnerId) || copertoDinnerId <= 0) {
                await conn.rollback();
                return res
                    .status(400)
                    .json({ error: 'CENA: coperto non valido' });
            }

            for (const m of dailyMeals) {
                const idFood =
                    m.type === 'pranzo' ? copertoLunchId : copertoDinnerId;
                values.push([m.id_meal, idFood, seasonType, 1]);
            }

            if (values.length === 0) {
                await conn.rollback();
                return res
                    .status(400)
                    .json({ error: 'Nessun piatto da salvare' });
            }

            await conn.query(
                `INSERT INTO dish_pairing (id_meal, id_food, season_type, used) VALUES ?`,
                [values],
            );

            await conn.commit();
            return res.json({ ok: true, inserted: values.length });
        } catch (e) {
            await conn.rollback();
            console.error('Errore upsertMenuFixedDishes:', e);
            return res
                .status(500)
                .json({ error: 'Errore salvataggio piatti fissi' });
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error('Errore upsertMenuFixedDishes:', err);
        return res.status(500).json({ error: 'Errore interno al server' });
    }
}

export async function getMenuFixedCheesesRotation(req, res) {
    try {
        const seasonType = decodeURIComponent(
            req.params.season_type ?? '',
        ).trim();
        if (!seasonType)
            return res.status(400).json({ error: 'season_type non valido' });

        const CHEESE_IDS = [195, 196, 197];

        // Prendo solo i primi 7 giorni (0..6) perché identificano la “settimana tipo”.
        const [rows] = await pool.query(
            `
            SELECT
                m.type AS meal_type,
                m.day_index,
                f.id_food,
                f.name
            FROM dish_pairing dp
            JOIN meal m ON m.id_meal = dp.id_meal
            JOIN food f ON f.id_food = dp.id_food
            WHERE dp.season_type = ?
              AND dp.used = 1
              AND m.first_choice = 1
              AND m.day_index BETWEEN 0 AND 6
              AND f.id_food IN (?)
            `,
            [seasonType, CHEESE_IDS],
        );

        const out = {
            pranzo: Array(7).fill(null),
            cena: Array(7).fill(null),
        };

        for (const r of rows) {
            const idx = Number(r.day_index);
            if (idx < 0 || idx > 6) continue;
            if (r.meal_type !== 'pranzo' && r.meal_type !== 'cena') continue;

            // salvo id_food (puoi salvare anche name se vuoi)
            out[r.meal_type][idx] = {
                id_food: r.id_food,
                name: r.name,
            };
        }

        return res.json({ data: out });
    } catch (err) {
        console.error('Errore getMenuFixedCheesesRotation:', err);
        return res
            .status(500)
            .json({ error: 'Errore caricamento rotazione formaggi' });
    }
}
