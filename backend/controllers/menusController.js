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
            SELECT
                x.season_type,
                SUM(CASE WHEN x.cnt_day_dishes >= 4 THEN 1 ELSE 0 END) AS meals_completed
            FROM (
                SELECT
                dp.season_type,
                dp.id_meal,
                COUNT(*) AS cnt_day_dishes
                FROM dish_pairing dp
                JOIN meal m ON m.id_meal = dp.id_meal
                WHERE m.first_choice = 0
                GROUP BY dp.season_type, dp.id_meal
            ) x
            GROUP BY x.season_type
            ) cm ON cm.season_type = s.season_type

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

        // (opzionale ma utile) verifica che il menù esista
        const [seasonRows] = await pool.query(
            `SELECT 1 FROM season WHERE season_type = ? LIMIT 1`,
            [seasonType]
        );
        if (seasonRows.length === 0) {
            return res.status(404).json({ error: 'Menù non trovato' });
        }

        const [rows] = await pool.query(
            `
            SELECT
                m.day_index,
                m.type,

                COALESCE(dp_cnt.cnt_day_dishes, 0) AS day_dishes_count,

                CASE
                    WHEN COALESCE(dp_cnt.cnt_day_dishes, 0) >= 4 THEN 1
                    ELSE 0
                END AS is_completed

            FROM meal m

            LEFT JOIN (
                SELECT
                    dp.id_meal,
                    COUNT(*) AS cnt_day_dishes
                FROM dish_pairing dp
                WHERE dp.season_type = ?
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
        const seasonType = (req.params.season_type ?? '').trim();
        if (!seasonType) {
            return res.status(400).json({ error: 'season_type non valido' });
        }

        const start_date = (req.body.start_date ?? '').trim();
        const end_date = (req.body.end_date ?? '').trim();

        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Date non valide' });
        }
        if (end_date < start_date) {
            return res.status(400).json({
                error: 'La data fine deve essere >= data inizio',
            });
        }

        const [result] = await pool.query(
            `
            UPDATE season
            SET start_date = ?, end_date = ?
            WHERE season_type = ?
            `,
            [start_date, end_date, seasonType]
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

/* DA CREARE LA CHIAMATA DI ELIMINAZIONE DEL MENU' E SALVATAGGIO NELL ARCHIVIO */
export async function deleteMenu(req, res) {}
