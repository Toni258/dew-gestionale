import { pool } from '../db/db.js';
import path from 'path';
import fs from 'fs/promises';

const IMAGES_DIR = path.join(process.cwd(), '..', 'public', 'food-images');

export async function getFilteredDishes(req, res) {
    try {
        const {
            search = '',
            stato = '',
            tipologia = '',
            page = '1',
            pageSize = '30',
        } = req.query;

        let allergeni = req.query.allergeni ?? [];
        if (!Array.isArray(allergeni)) allergeni = [allergeni];
        allergeni = allergeni.filter(Boolean);

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const sizeNum = Math.min(
            100,
            Math.max(1, parseInt(pageSize, 10) || 30)
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
                WHERE CURDATE() BETWEEN valid_from AND valid_to
            ) susp
                ON susp.id_food = f.id_food

            -- ATTIVI oggi (1 riga per id_food)
            LEFT JOIN (
                SELECT DISTINCT dp.id_food
                FROM dish_pairing dp
                JOIN season s
                    ON s.season_type = dp.season_type
                AND CURDATE() BETWEEN s.start_date AND s.end_date
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

export async function getFirstMeals(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM food LIMIT 5');

        res.json(rows);
    } catch (err) {
        console.error('Errore DB:', err);
        res.status(500).json({ error: 'Errore database' });
    }
}

export async function checkDishName(req, res) {
    try {
        const name = (req.query.name ?? '').trim();
        const excludeId = req.query.excludeId ?? null;

        if (!name) return res.json({ exists: false });

        // confronto case-insensitive e spazi normalizzati
        const normalized = name.replace(/\s+/g, ' ').toLowerCase();

        let sql = `
            SELECT 1
            FROM food
            WHERE LOWER(TRIM(name)) = ?
        `;

        const params = [normalized];

        if (excludeId) {
            sql += ` AND id_food <> ?`;
            params.push(excludeId);
        }

        sql += ` LIMIT 1`;

        const [rows] = await pool.query(sql, params);

        return res.json({ exists: rows.length > 0 });
    } catch (err) {
        console.error('Errore checkDishName:', err);
        return res.status(500).json({ error: 'Errore interno al server' });
    }
}

export async function createDish(req, res) {
    try {
        const {
            name,
            type,
            grammage_tot,
            kcal_tot,
            proteins,
            carbohydrates,
            fats,
            allergy_notes,
        } = req.body;

        const img = req.file ? req.file.filename : null;

        const sql = `
            INSERT INTO food
            (name, type, image_url, grammage_tot, kcal_tot, proteins, carbs, fats, allergy_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await pool.query(sql, [
            name,
            type,
            img,
            grammage_tot,
            kcal_tot,
            proteins,
            carbohydrates,
            fats,
            allergy_notes?.join(', ') ?? null,
        ]);

        return res.status(201).json({ success: true });
    } catch (err) {
        console.error('Errore createDish:', err);
        return res.status(500).json({ error: 'Errore creazione piatto' });
    }
}

export async function deleteDish(req, res) {
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
        return res.status(400).json({ error: 'id non valido' });
    }

    try {
        // recupero immagine
        const [[dish]] = await pool.query(
            'SELECT image_url FROM food WHERE id_food = ?',
            [id]
        );

        if (!dish) {
            return res
                .status(404)
                .json({ error: 'Piatto non trovato per immagine' });
        }

        const [result] = await pool.query(
            'DELETE FROM food WHERE id_food = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: 'Piatto non trovato per delete' });
        }

        // cancello immagine
        if (dish.image_url) {
            const imgPath = path.join(IMAGES_DIR, dish.image_url);
            try {
                await fs.unlink(imgPath);
            } catch (err) {
                console.warn('Immagine non trovata:', imgPath);
            }
        }

        return res.json({ success: true });
    } catch (err) {
        // tipico: vincoli FK (dish_pairing, food_availability, ecc.)
        if (err?.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                error: 'Impossibile eliminare: il piatto è usato altrove.',
            });
        }

        console.error('Errore deleteDish:', err);
        return res.status(500).json({ error: 'Errore eliminazione piatto' });
    }
}

export async function getDishById(req, res) {
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
        return res.status(400).json({ error: 'id non valido' });
    }

    try {
        const sql = `
            SELECT
                id_food,
                name,
                type,
                image_url,
                grammage_tot,
                kcal_tot,
                proteins,
                carbs,
                fats,
                allergy_notes
            FROM food
            WHERE id_food = ?
            LIMIT 1
        `;

        const [rows] = await pool.query(sql, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Piatto non trovato' });
        }

        const dish = rows[0];

        // sospensione “attuale o futura” più recente
        const availSql = `
            SELECT 
                id_avail, 
                DATE_FORMAT(valid_from, '%Y-%m-%d') AS valid_from, 
                DATE_FORMAT(valid_to, '%Y-%m-%d')   AS valid_to, 
                reason
            FROM food_availability
            WHERE id_food = ?
              AND valid_to >= CURDATE()
            ORDER BY valid_from ASC
            LIMIT 1
        `;
        const [availRows] = await pool.query(availSql, [id]);
        const suspension = availRows[0] ?? null;

        return res.json({
            ...dish,
            allergy_notes: dish.allergy_notes
                ? dish.allergy_notes.split(',').map((a) => a.trim())
                : [],
            suspension, // {id_avail, valid_from, valid_to, reason} oppure null
        });
    } catch (err) {
        console.error('Errore getDishById:', err);
        return res.status(500).json({ error: 'Errore interno' });
    }
}

export async function updateDish(req, res) {
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
        return res.status(400).json({ error: 'id non valido' });
    }

    const conn = await pool.getConnection();

    // ci serve dopo per eventuale unlink
    let oldImage = null;
    let newImage = null;

    try {
        await conn.beginTransaction();

        const {
            name,
            type,
            grammage_tot,
            kcal_tot,
            proteins,
            carbohydrates,
            fats,
            allergy_notes,

            // sospensione
            suspension_enabled,
            suspension_id,
            start_date,
            end_date,
            reason,
        } = req.body;

        // immagine nuova
        newImage = req.file ? req.file.filename : null;

        // recupera immagine attuale
        const [[current]] = await conn.query(
            'SELECT image_url FROM food WHERE id_food = ?',
            [id]
        );

        if (!current) {
            await conn.rollback();
            return res.status(404).json({ error: 'Piatto non trovato' });
        }

        oldImage = current.image_url;
        const imageToSave = newImage ?? oldImage;

        // 1) update food
        const sql = `
            UPDATE food
            SET
                name = ?,
                type = ?,
                image_url = ?,
                grammage_tot = ?,
                kcal_tot = ?,
                proteins = ?,
                carbs = ?,
                fats = ?,
                allergy_notes = ?
            WHERE id_food = ?
        `;

        await conn.query(sql, [
            name,
            type,
            imageToSave,
            grammage_tot,
            kcal_tot,
            proteins,
            carbohydrates,
            fats,
            Array.isArray(allergy_notes) ? allergy_notes.join(', ') : null,
            id,
        ]);

        // 2) sospensione (storico)
        const enabled = String(suspension_enabled) === '1';
        const sid = suspension_id ? Number(suspension_id) : null;

        if (enabled) {
            if (!start_date || !end_date) {
                await conn.rollback();
                return res.status(400).json({
                    error: 'Periodo sospensione non valido',
                });
            }

            if (sid) {
                // UPDATE stessa tupla
                await conn.query(
                    `
                    UPDATE food_availability
                    SET valid_from = ?, valid_to = ?, reason = ?
                    WHERE id_avail = ? AND id_food = ?
                    `,
                    [
                        start_date,
                        end_date,
                        (reason ?? '').trim() || null,
                        sid,
                        id,
                    ]
                );
            } else {
                // INSERT nuovo record (storico)
                await conn.query(
                    `
                    INSERT INTO food_availability (id_food, valid_from, valid_to, reason)
                    VALUES (?, ?, ?, ?)
                    `,
                    [id, start_date, end_date, (reason ?? '').trim() || null]
                );
            }
        } else {
            // toggle OFF: non cancellare. “Scade ora”.
            // Se abbiamo un id specifico, scadi quello (se ancora attivo/futuro)
            if (sid) {
                await conn.query(
                    `
                    UPDATE food_availability
                    SET valid_to = CURDATE()
                    WHERE id_avail = ? AND id_food = ? AND valid_to >= CURDATE()
                    `,
                    [sid, id]
                );
            } else {
                // fallback: se non hai id ma esiste una sospensione attuale/futura, scadi quella più vicina
                await conn.query(
                    `
                    UPDATE food_availability
                    SET valid_to = CURDATE()
                    WHERE id_food = ? AND valid_to >= CURDATE()
                    ORDER BY valid_from ASC
                    LIMIT 1
                    `,
                    [id]
                );
            }
        }

        await conn.commit();

        // rispondi subito al frontend
        res.json({ success: true });

        // 3) unlink immagine vecchia (fuori dalla transazione)
        if (newImage && oldImage && newImage !== oldImage) {
            const oldPath = path.join(IMAGES_DIR, oldImage);
            fs.unlink(oldPath).catch((err) => {
                if (err.code !== 'ENOENT') {
                    console.error('Errore cancellazione immagine:', err);
                }
            });
        }
    } catch (err) {
        try {
            await conn.rollback();
        } catch {}
        console.error('Errore updateDish:', err);

        if (err?.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Nome piatto già esistente' });
        }

        return res.status(500).json({ error: 'Errore aggiornamento piatto' });
    } finally {
        conn.release();
    }
}
