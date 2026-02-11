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
            [id],
        );

        if (!dish) {
            return res
                .status(404)
                .json({ error: 'Piatto non trovato per immagine' });
        }

        const [result] = await pool.query(
            'DELETE FROM food WHERE id_food = ?',
            [id],
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
                AND valid_to >= NOW()
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
            [id],
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

export async function suspendDish(req, res) {
    const idFood = Number(req.params.id);

    if (!Number.isFinite(idFood)) {
        return res.status(400).json({ error: 'id non valido' });
    }

    try {
        const {
            valid_from,
            valid_to,
            reason = '',
            mode = 'dry-run',
            action = 'disable-only', // 'disable-only' | 'replace'
            replacements = [],
        } = req.body;

        if (!valid_from || !valid_to) {
            return res.status(400).json({
                error: 'Parametri obbligatori: valid_from, valid_to',
            });
        }

        if (valid_to < valid_from) {
            return res.status(400).json({
                error: 'valid_to deve essere >= valid_from',
            });
        }

        if (!['dry-run', 'apply'].includes(mode)) {
            return res.status(400).json({
                error: 'mode non valido (usa dry-run o apply)',
            });
        }

        if (!['disable-only', 'replace'].includes(action)) {
            return res.status(400).json({
                error: 'action non valida (usa disable-only o replace)',
            });
        }

        // Verifica esistenza piatto (e recupero nome utile in risposta)
        const [[dish]] = await pool.query(
            `SELECT id_food, name FROM food WHERE id_food = ? LIMIT 1`,
            [idFood],
        );

        if (!dish) {
            return res.status(404).json({ error: 'Piatto non trovato' });
        }

        // ==========================
        // STEP A) Analisi interferenze (sempre)
        // ==========================
        // Interferenza = esiste un dish_pairing per quel piatto,
        const conflictsSql = `
            SELECT
                dp.id_dish_pairing,
                dp.season_type,
                dp.id_meal,
                dp.used,

                m.day_index,
                m.type AS meal_type,
                m.first_choice,

                f.type AS course_type,
                f.name AS food_name,

                DATE_FORMAT(s.start_date, '%Y-%m-%d') AS season_start,
                DATE_FORMAT(s.end_date,   '%Y-%m-%d') AS season_end,

                CASE
                    WHEN NOW() BETWEEN s.start_date AND s.end_date THEN 1
                    ELSE 0
                END AS is_menu_active_today

            FROM dish_pairing dp
            JOIN season s ON s.season_type = dp.season_type
            JOIN meal m   ON m.id_meal = dp.id_meal
            JOIN food f   ON f.id_food = dp.id_food

            WHERE dp.id_food = ?
            AND dp.used = 1
            AND s.start_date <= ?
            AND s.end_date   >= ?

            ORDER BY
                is_menu_active_today DESC,
                dp.season_type ASC,
                m.first_choice DESC,
                m.day_index ASC,
                FIELD(m.type, 'pranzo', 'cena') ASC
        `;

        const [conflicts] = await pool.query(conflictsSql, [
            idFood,
            valid_to,
            valid_from,
        ]);

        const activeCount = conflicts.filter(
            (c) => c.is_menu_active_today === 1,
        ).length;

        // Risposta “dry-run” (STEP B)
        if (mode === 'dry-run') {
            return res.json({
                ok: true,
                mode: 'dry-run',
                dish: { id_food: dish.id_food, name: dish.name },
                suspension: {
                    valid_from,
                    valid_to,
                    reason: (reason ?? '').trim() || null,
                },
                conflicts,
                summary: {
                    conflicts_total: conflicts.length,
                    conflicts_in_active_menu: activeCount,
                },
                message:
                    conflicts.length > 0
                        ? 'La sospensione impatta alcuni menu. Conferma per applicare (disabilitazione occorrenze) e, se vuoi, sostituire.'
                        : 'Nessuna interferenza: puoi applicare la sospensione.',
            });
        }

        // ==========================
        // STEP C) Applicazione (apply) — transazionale
        // ==========================
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // 1) verifica se esiste già una sospensione attiva o futura
            const [[existing]] = await conn.query(
                `
                SELECT id_avail
                FROM food_availability
                WHERE id_food = ?
                AND valid_to >= CURDATE()
                LIMIT 1
                `,
                [idFood],
            );

            if (existing) {
                // UPDATE (modifica sospensione esistente)
                await conn.query(
                    `
                        UPDATE food_availability
                        SET
                            valid_from = ?,
                            valid_to   = ?,
                            reason     = ?
                        WHERE id_avail = ?
                    `,
                    [
                        valid_from,
                        valid_to,
                        (reason ?? '').trim() || null,
                        existing.id_avail,
                    ],
                );
            } else {
                // INSERT (prima sospensione)
                await conn.query(
                    `
                        INSERT INTO food_availability (id_food, valid_from, valid_to, reason)
                        VALUES (?, ?, ?, ?)
                    `,
                    [
                        idFood,
                        valid_from,
                        valid_to,
                        (reason ?? '').trim() || null,
                    ],
                );
            }

            // 2) Disabilita i dish_pairing nel periodo (soft delete)
            // + opzionalmente crea i nuovi dish_pairing sostitutivi scelti dall’utente

            const repArr = Array.isArray(replacements) ? replacements : [];

            // mappa: id_dish_pairing -> id_food_new (può essere null/undefined se l’utente non sceglie)
            const repMap = new Map(
                repArr
                    .filter((r) => Number.isFinite(Number(r.id_dish_pairing)))
                    .map((r) => [
                        Number(r.id_dish_pairing),
                        r.id_food_new == null || r.id_food_new === ''
                            ? null
                            : Number(r.id_food_new),
                    ]),
            );

            // per sicurezza: lavora SOLO sui pairing che hai trovato come conflicts (quelli nel range)
            const conflictIds = conflicts
                .map((c) => Number(c.id_dish_pairing))
                .filter(Number.isFinite);

            // Regole dei 2 pulsanti (coerenza UX)
            if (action === 'replace') {
                const missing = conflictIds.filter((id) => !repMap.get(id));
                if (missing.length) {
                    await conn.rollback();
                    return res.status(400).json({
                        error: 'Per "Salva e sostituisci" devi selezionare un piatto per ogni occorrenza.',
                    });
                }
            }

            if (action === 'disable-only') {
                const hasAny = conflictIds.some((id) => !!repMap.get(id));
                if (hasAny) {
                    await conn.rollback();
                    return res.status(400).json({
                        error: 'Per "Salva sospensione (non sostituire)" le sostituzioni devono essere vuote.',
                    });
                }
            }

            let disabledPairings = 0;

            // (A) set used=0 sui pairing del piatto sospeso (solo quelli trovati nella preview)
            if (conflictIds.length > 0) {
                const disableSql = `
                    UPDATE dish_pairing
                    SET used = 0
                    WHERE id_dish_pairing IN (?)
                    AND id_food = ?
                    AND used = 1
                `;

                const [disableRes] = await conn.query(disableSql, [
                    conflictIds,
                    idFood,
                ]);

                disabledPairings = disableRes.affectedRows ?? 0;
            }

            // (B) Inserisci nuovi pairing per le occorrenze dove l’utente ha scelto un sostituto
            // Regole di sicurezza:
            // - il sostituto deve avere stesso food.type del piatto originale in quella occorrenza
            // - evita duplicati: se esiste già un pairing used=1 con stesso (season_type,id_meal,id_food_new), non inserire

            let insertedPairings = 0;
            let skippedDuplicates = 0;

            const getFoodTypeSql = `SELECT id_food, type FROM food WHERE id_food = ? LIMIT 1`;

            // query per leggere “dati pairing” dell’occorrenza (serve per copiare id_meal e season_type)
            const pairingInfoSql = `
                SELECT dp.id_dish_pairing, dp.id_meal, dp.season_type, f.type AS old_type, m.type AS meal_type
                FROM dish_pairing dp
                JOIN food f ON f.id_food = dp.id_food
                JOIN meal m ON m.id_meal = dp.id_meal
                WHERE dp.id_dish_pairing = ?
                    AND dp.id_food = ?
                LIMIT 1
            `;

            // check duplicato
            const existsSql = `
                SELECT id_dish_pairing
                FROM dish_pairing
                WHERE season_type = ?
                    AND id_meal = ?
                    AND id_food = ?
                    AND used = 1
                LIMIT 1
            `;

            const insertSql = `
                INSERT INTO dish_pairing (id_meal, id_food, season_type, used)
                VALUES (?, ?, ?, 1)
            `;

            const isSuspendedInRangeSql = `
                SELECT 1
                FROM food_availability fa
                WHERE fa.id_food = ?
                AND NOT (? < fa.valid_from OR ? > fa.valid_to)
                LIMIT 1
            `;

            const isFixedInMenuSql = `
                SELECT 1
                FROM dish_pairing dp
                JOIN meal m ON m.id_meal = dp.id_meal
                WHERE dp.id_food = ?
                AND dp.season_type = ?
                AND dp.used = 1
                AND m.type = ?
                AND m.first_choice = 1
                LIMIT 1
            `;

            if (action !== 'replace') {
                await conn.commit();
                return res.json({
                    ok: true,
                    mode: 'apply',
                    action,
                    dish: { id_food: dish.id_food, name: dish.name },
                    suspension: {
                        valid_from,
                        valid_to,
                        reason: (reason ?? '').trim() || null,
                    },
                    disabled_pairings: disabledPairings,
                    inserted_pairings: 0,
                    skipped_duplicates: 0,
                    conflicts_preview: conflicts,
                    summary: {
                        conflicts_total: conflicts.length,
                        conflicts_in_active_menu: activeCount,
                    },
                    message:
                        'Sospensione applicata: occorrenze disabilitate (menù da completare manualmente).',
                });
            }

            for (const cId of conflictIds) {
                const newFoodId = repMap.get(cId);

                // se non selezionato: lasci solo used=0 (menu “buca”, come prima)
                if (!newFoodId) continue;

                if (newFoodId === idFood) {
                    await conn.rollback();
                    return res.status(400).json({
                        error: 'Sostituzione non valida: stesso piatto.',
                    });
                }

                // pairing info
                const [[pinfo]] = await conn.query(pairingInfoSql, [
                    cId,
                    idFood,
                ]);
                if (!pinfo) {
                    await conn.rollback();
                    return res
                        .status(400)
                        .json({ error: `Occorrenza ${cId} non valida.` });
                }

                // tipo nuovo piatto
                const [[newDishRow]] = await conn.query(getFoodTypeSql, [
                    newFoodId,
                ]);
                if (!newDishRow) {
                    await conn.rollback();
                    return res.status(400).json({
                        error: `Piatto sostitutivo ${newFoodId} non trovato.`,
                    });
                }

                // vincolo: stesso tipo portata
                if (newDishRow.type !== pinfo.old_type) {
                    await conn.rollback();
                    return res.status(400).json({
                        error: `Tipo non compatibile per occorrenza ${cId}: serve ${pinfo.old_type}, hai scelto ${newDishRow.type}.`,
                    });
                }

                // (1) non sospeso nel range selezionato
                const [[sus]] = await conn.query(isSuspendedInRangeSql, [
                    newFoodId,
                    valid_to,
                    valid_from,
                ]);
                if (sus) {
                    await conn.rollback();
                    return res.status(400).json({
                        error: `Il piatto selezionato (${newFoodId}) è sospeso nel periodo scelto.`,
                    });
                }

                // (2) non deve essere un piatto fisso del menu (per quel pasto)
                const [[fixed]] = await conn.query(isFixedInMenuSql, [
                    newFoodId,
                    pinfo.season_type,
                    pinfo.meal_type,
                ]);
                if (fixed) {
                    await conn.rollback();
                    return res.status(400).json({
                        error: `Il piatto selezionato (${newFoodId}) è un piatto fisso nel menù "${pinfo.season_type}" (${pinfo.meal_type}).`,
                    });
                }

                // evita duplicato
                const [[exists]] = await conn.query(existsSql, [
                    pinfo.season_type,
                    pinfo.id_meal,
                    newFoodId,
                ]);

                if (exists) {
                    skippedDuplicates += 1;
                    continue;
                }

                await conn.query(insertSql, [
                    pinfo.id_meal,
                    newFoodId,
                    pinfo.season_type,
                ]);
                insertedPairings += 1;
            }

            await conn.commit();

            return res.json({
                ok: true,
                mode: 'apply',
                dish: { id_food: dish.id_food, name: dish.name },
                suspension: {
                    valid_from,
                    valid_to,
                    reason: (reason ?? '').trim() || null,
                },
                disabled_pairings: disabledPairings,
                inserted_pairings: insertedPairings,
                skipped_duplicates: skippedDuplicates,
                conflicts_preview: conflicts,
                summary: {
                    conflicts_total: conflicts.length,
                    conflicts_in_active_menu: activeCount,
                },
                message:
                    'Sospensione applicata: occorrenze disabilitate e sostituzioni inserite dove selezionate.',
            });
        } catch (e) {
            try {
                await conn.rollback();
            } catch {}
            console.error('Errore suspendDish apply:', e);
            return res.status(500).json({
                error: 'Errore applicazione sospensione',
            });
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error('Errore suspendDish:', err);
        return res.status(500).json({ error: 'Errore interno al server' });
    }
}

export async function disableDishSuspension(req, res) {
    const idFood = Number(req.params.id);

    if (!Number.isFinite(idFood)) {
        return res.status(400).json({ error: 'id non valido' });
    }

    try {
        // chiude eventuali sospensioni attive o future
        const [result] = await pool.query(
            `
            UPDATE food_availability
            SET valid_to = DATE_SUB(NOW(), INTERVAL 1 SECOND)
            WHERE id_food = ?
              AND valid_to >= NOW()
            `,
            [idFood],
        );

        return res.json({
            ok: true,
            closed_records: result.affectedRows,
            message: 'Sospensione disattivata',
        });
    } catch (err) {
        console.error('Errore disableDishSuspension:', err);
        return res.status(500).json({
            error: 'Errore disattivazione sospensione',
        });
    }
}
