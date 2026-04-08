
// Database queries used for dishes.
export async function countFilteredDishes(
    poolOrConn,
    { search = '', status = '', type = '', allergens = [] } = {},
) {
    const { whereSql, params, baseSql } = buildDishFilters({
        search,
        status,
        type,
        allergens,
    });

    const [rows] = await poolOrConn.query(
        `
            SELECT COUNT(DISTINCT f.id_food) AS total
            ${baseSql}
            ${whereSql}
        `,
        params,
    );

    return Number(rows[0]?.total ?? 0);
}

// Returns the list used by filtered dishes.
export async function listFilteredDishes(
    poolOrConn,
    { search = '', status = '', type = '', allergens = [], page = 1, pageSize = 30 } = {},
) {
    const { whereSql, params, baseSql } = buildDishFilters({
        search,
        status,
        type,
        allergens,
    });
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 30));
    const offset = (safePage - 1) * safePageSize;

    const [rows] = await poolOrConn.query(
        `
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
            ${baseSql}
            ${whereSql}
            ORDER BY f.name ASC
            LIMIT ? OFFSET ?
        `,
        [...params, safePageSize, offset],
    );

    return rows;
}

// Builds the data needed for dish filters.
function buildDishFilters({ search = '', status = '', type = '', allergens = [] } = {}) {
    let whereSql = ' WHERE 1=1 ';
    const params = [];

    if (String(search).trim()) {
        whereSql += ' AND f.name LIKE ? ';
        params.push(`%${String(search).trim()}%`);
    }

    if (String(type).trim()) {
        whereSql += ' AND f.type = ? ';
        params.push(String(type).trim());
    }

    if (status === 'sospeso') {
        whereSql += ' AND susp.id_food IS NOT NULL ';
    }

    if (status === 'attivo') {
        whereSql += ' AND susp.id_food IS NULL AND act.id_food IS NOT NULL ';
    }

    if (status === 'non_attivo') {
        whereSql += ' AND susp.id_food IS NULL AND act.id_food IS NULL ';
    }

    for (const allergen of allergens) {
        whereSql += ' AND (f.allergy_notes IS NULL OR f.allergy_notes NOT LIKE ?) ';
        params.push(`%${allergen}%`);
    }

    const baseSql = `
        FROM food f
        LEFT JOIN (
            SELECT DISTINCT id_food
            FROM food_availability
            WHERE restored_at IS NULL
              AND NOW() BETWEEN valid_from AND valid_to
        ) susp ON susp.id_food = f.id_food
        LEFT JOIN (
            SELECT DISTINCT dp.id_food
            FROM dish_pairing dp
            JOIN season s
                ON s.season_type = dp.season_type
               AND NOW() BETWEEN s.start_date AND s.end_date
            WHERE dp.used = 1
        ) act ON act.id_food = f.id_food
    `;

    return { whereSql, params, baseSql };
}

// Checks the current value for dish name exists.
export async function checkDishNameExists(
    poolOrConn,
    normalizedName,
    { excludeId } = {},
) {
    const params = [normalizedName];
    let sql = `
        SELECT 1
        FROM food
        WHERE LOWER(TRIM(name)) = ?
    `;

    if (excludeId) {
        sql += ' AND id_food <> ?';
        params.push(excludeId);
    }

    sql += ' LIMIT 1';

    const [rows] = await poolOrConn.query(sql, params);
    return rows.length > 0;
}

// Inserts the data for dish.
export async function insertDish(poolOrConn, payload) {
    const [result] = await poolOrConn.query(
        `
            INSERT INTO food (
                name,
                type,
                image_url,
                grammage_tot,
                kcal_tot,
                proteins,
                carbs,
                fats,
                allergy_notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            payload.name,
            payload.type,
            payload.image_url,
            payload.grammage_tot,
            payload.kcal_tot,
            payload.proteins,
            payload.carbohydrates,
            payload.fats,
            payload.allergy_notes,
        ],
    );

    return result.insertId;
}

// Finds the data for dish summary by id.
export async function findDishSummaryById(poolOrConn, dishId) {
    const [rows] = await poolOrConn.query(
        `
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
        `,
        [dishId],
    );

    return rows[0] ?? null;
}

// Finds the data for current or future suspension by food id.
export async function findCurrentOrFutureSuspensionByFoodId(poolOrConn, dishId) {
    const [rows] = await poolOrConn.query(
        `
            SELECT
                id_avail,
                DATE_FORMAT(valid_from, '%Y-%m-%d') AS valid_from,
                DATE_FORMAT(valid_to, '%Y-%m-%d') AS valid_to,
                reason,
                restored_at
            FROM food_availability
            WHERE id_food = ?
              AND restored_at IS NULL
              AND valid_to >= NOW()
            ORDER BY valid_from ASC
            LIMIT 1
        `,
        [dishId],
    );

    return rows[0] ?? null;
}

// Updates the data for dish.
export async function updateDish(poolOrConn, dishId, payload) {
    const [result] = await poolOrConn.query(
        `
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
        `,
        [
            payload.name,
            payload.type,
            payload.image_url,
            payload.grammage_tot,
            payload.kcal_tot,
            payload.proteins,
            payload.carbohydrates,
            payload.fats,
            payload.allergy_notes,
            dishId,
        ],
    );

    return result.affectedRows ?? 0;
}

// Deletes the data for dish.
export async function deleteDish(poolOrConn, dishId) {
    const [result] = await poolOrConn.query(
        `DELETE FROM food WHERE id_food = ?`,
        [dishId],
    );

    return result.affectedRows ?? 0;
}

// Helper function used by upsert food availability.
export async function upsertFoodAvailability(
    poolOrConn,
    { existingIdAvail, dishId, validFrom, validTo, reason },
) {
    if (existingIdAvail) {
        await poolOrConn.query(
            `
                UPDATE food_availability
                SET valid_from = ?, valid_to = ?, reason = ?, restored_at = NULL
                WHERE id_avail = ?
            `,
            [validFrom, validTo, reason, existingIdAvail],
        );

        return existingIdAvail;
    }

    const [result] = await poolOrConn.query(
        `
            INSERT INTO food_availability (id_food, valid_from, valid_to, reason, restored_at)
            VALUES (?, ?, ?, ?, NULL)
        `,
        [dishId, validFrom, validTo, reason],
    );

    return result.insertId;
}

// Helper function used by restore original dish pairings by range.
export async function restoreOriginalDishPairingsByRange(
    poolOrConn,
    { dishId, validFrom, validTo },
) {
    const [result] = await poolOrConn.query(
        `
            UPDATE dish_pairing dp
            JOIN season s ON s.season_type = dp.season_type
            SET dp.used = 1
            WHERE dp.id_food = ?
              AND dp.used = 0
              AND s.start_date <= ?
              AND s.end_date >= ?
        `,
        [dishId, validTo, validFrom],
    );

    return result.affectedRows ?? 0;
}

// Returns the list used by dish conflicts for period.
export async function listDishConflictsForPeriod(
    poolOrConn,
    { dishId, validFrom, validTo },
) {
    const [rows] = await poolOrConn.query(
        `
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
                DATE_FORMAT(s.end_date, '%Y-%m-%d') AS season_end,
                CASE
                    WHEN NOW() BETWEEN s.start_date AND s.end_date THEN 1
                    ELSE 0
                END AS is_menu_active_today
            FROM dish_pairing dp
            JOIN season s ON s.season_type = dp.season_type
            JOIN meal m ON m.id_meal = dp.id_meal
            JOIN food f ON f.id_food = dp.id_food
            WHERE dp.id_food = ?
              AND s.start_date <= ?
              AND s.end_date >= ?
            ORDER BY
                is_menu_active_today DESC,
                dp.season_type ASC,
                m.first_choice DESC,
                m.day_index ASC,
                FIELD(m.type, 'pranzo', 'cena') ASC
        `,
        [dishId, validTo, validFrom],
    );

    return rows;
}

// Returns the list used by delete preview conflicts.
export async function listDishDeletionConflicts(poolOrConn, { dishId }) {
    const [rows] = await poolOrConn.query(
        `
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
                DATE_FORMAT(s.end_date, '%Y-%m-%d') AS season_end,
                CASE
                    WHEN CURDATE() BETWEEN s.start_date AND s.end_date THEN 1
                    ELSE 0
                END AS is_menu_active_today,
                CASE
                    WHEN s.start_date > CURDATE() THEN 1
                    ELSE 0
                END AS is_future_menu
            FROM dish_pairing dp
            JOIN season s ON s.season_type = dp.season_type
            JOIN meal m ON m.id_meal = dp.id_meal
            JOIN food f ON f.id_food = dp.id_food
            WHERE dp.id_food = ?
              AND dp.used = 1
            ORDER BY
                is_menu_active_today DESC,
                is_future_menu DESC,
                s.start_date ASC,
                dp.season_type ASC,
                m.first_choice DESC,
                m.day_index ASC,
                FIELD(m.type, 'pranzo', 'cena') ASC
        `,
        [dishId],
    );

    return rows;
}

// Disables the data used by dish pairings by ids.
export async function disableDishPairingsByIds(
    poolOrConn,
    { dishId, pairingIds },
) {
    if (!pairingIds.length) return 0;

    const [result] = await poolOrConn.query(
        `
            UPDATE dish_pairing
            SET used = 0
            WHERE id_dish_pairing IN (?)
              AND id_food = ?
              AND used = 1
        `,
        [pairingIds, dishId],
    );

    return result.affectedRows ?? 0;
}

// Finds the data for pairing info.
export async function findPairingInfo(poolOrConn, { pairingId, dishId }) {
    const [rows] = await poolOrConn.query(
        `
            SELECT
                dp.id_dish_pairing,
                dp.id_meal,
                dp.season_type,
                f.type AS old_type,
                m.type AS meal_type
            FROM dish_pairing dp
            JOIN food f ON f.id_food = dp.id_food
            JOIN meal m ON m.id_meal = dp.id_meal
            WHERE dp.id_dish_pairing = ?
              AND dp.id_food = ?
            LIMIT 1
        `,
        [pairingId, dishId],
    );

    return rows[0] ?? null;
}

// Finds the data for food type.
export async function findFoodType(poolOrConn, dishId) {
    const [rows] = await poolOrConn.query(
        `SELECT id_food, type FROM food WHERE id_food = ? LIMIT 1`,
        [dishId],
    );

    return rows[0] ?? null;
}

// Helper function used by is food suspended in range.
export async function isFoodSuspendedInRange(
    poolOrConn,
    { dishId, validFrom, validTo },
) {
    const [rows] = await poolOrConn.query(
        `
            SELECT 1
            FROM food_availability
            WHERE id_food = ?
              AND restored_at IS NULL
              AND NOT (? < valid_from OR ? > valid_to)
            LIMIT 1
        `,
        [dishId, validTo, validFrom],
    );

    return rows.length > 0;
}

// Helper function used by is food fixed in menu.
export async function isFoodFixedInMenu(
    poolOrConn,
    { dishId, seasonType, mealType },
) {
    const [rows] = await poolOrConn.query(
        `
            SELECT 1
            FROM dish_pairing dp
            JOIN meal m ON m.id_meal = dp.id_meal
            WHERE dp.id_food = ?
              AND dp.season_type = ?
              AND dp.used = 1
              AND m.type = ?
              AND m.first_choice = 1
            LIMIT 1
        `,
        [dishId, seasonType, mealType],
    );

    return rows.length > 0;
}

// Finds the data for active duplicate pairing.
export async function findActiveDuplicatePairing(
    poolOrConn,
    { seasonType, idMeal, dishId },
) {
    const [rows] = await poolOrConn.query(
        `
            SELECT id_dish_pairing
            FROM dish_pairing
            WHERE season_type = ?
              AND id_meal = ?
              AND id_food = ?
              AND used = 1
            LIMIT 1
        `,
        [seasonType, idMeal, dishId],
    );

    return rows[0] ?? null;
}

// Inserts the data for dish pairing.
export async function insertDishPairing(
    poolOrConn,
    { idMeal, dishId, seasonType, used = 1 },
) {
    const [result] = await poolOrConn.query(
        `
            INSERT INTO dish_pairing (id_meal, id_food, season_type, used)
            VALUES (?, ?, ?, ?)
        `,
        [idMeal, dishId, seasonType, used],
    );

    return result.insertId;
}

// Returns the list used by tracked replacement rows by availability.
export async function listTrackedReplacementRowsByAvailability(poolOrConn, idAvail) {
    const [rows] = await poolOrConn.query(
        `
            SELECT
                track.id_food_avail_pairing_replacement,
                track.id_avail,
                track.original_id_dish_pairing,
                track.replacement_id_dish_pairing,
                track.original_id_food,
                track.replacement_id_food,
                track.season_type,
                track.id_meal,
                track.disabled_at,
                repl_food.name AS replacement_food_name
            FROM food_availability_pairing_replacements track
            LEFT JOIN food repl_food
                ON repl_food.id_food = track.replacement_id_food
            WHERE track.id_avail = ?
            ORDER BY track.id_food_avail_pairing_replacement ASC
        `,
        [idAvail],
    );

    return rows;
}

// Inserts the data for tracked replacement row.
export async function insertTrackedReplacementRow(
    poolOrConn,
    {
        idAvail,
        originalIdDishPairing,
        replacementIdDishPairing,
        originalIdFood,
        replacementIdFood,
        seasonType,
        idMeal,
    },
) {
    await poolOrConn.query(
        `
            INSERT INTO food_availability_pairing_replacements (
                id_avail,
                original_id_dish_pairing,
                replacement_id_dish_pairing,
                original_id_food,
                replacement_id_food,
                season_type,
                id_meal,
                disabled_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
        `,
        [
            idAvail,
            originalIdDishPairing,
            replacementIdDishPairing,
            originalIdFood,
            replacementIdFood,
            seasonType,
            idMeal,
        ],
    );
}

// Disables the data used by tracked replacement pairings by availability.
export async function disableTrackedReplacementPairingsByAvailability(
    poolOrConn,
    idAvail,
) {
    const [result] = await poolOrConn.query(
        `
            UPDATE dish_pairing dp
            JOIN food_availability_pairing_replacements trap
                ON trap.replacement_id_dish_pairing = dp.id_dish_pairing
            SET
                dp.used = 0,
                trap.disabled_at = COALESCE(trap.disabled_at, NOW())
            WHERE trap.id_avail = ?
              AND dp.used = 1
        `,
        [idAvail],
    );

    await poolOrConn.query(
        `
            UPDATE food_availability_pairing_replacements
            SET disabled_at = COALESCE(disabled_at, NOW())
            WHERE id_avail = ?
        `,
        [idAvail],
    );

    return result.affectedRows ?? 0;
}

// Helper function used by close food availability.
export async function closeFoodAvailability(poolOrConn, idAvail) {
    const [result] = await poolOrConn.query(
        `
            UPDATE food_availability
            SET valid_to = DATE_SUB(NOW(), INTERVAL 1 SECOND), restored_at = NOW()
            WHERE id_avail = ?
        `,
        [idAvail],
    );

    return result.affectedRows ?? 0;
}
