export async function listMenus(poolOrConn) {
    const [rows] = await poolOrConn.query(`
        SELECT
            s.id_arch_menu,
            s.season_type,
            DATE_FORMAT(s.start_date, '%d-%m-%Y') AS start_date,
            DATE_FORMAT(s.end_date,   '%d-%m-%Y') AS end_date,
            CONCAT(
                DATE_FORMAT(s.start_date, '%d.%m.%Y'),
                ' - ',
                DATE_FORMAT(s.end_date,   '%d.%m.%Y')
            ) AS period_label,
            YEAR(s.start_date) AS start_year,
            56 AS meals_total,
            COALESCE(cm.meals_completed, 0) AS meals_completed
        FROM arch_menu s
        LEFT JOIN (
            SELECT
                y.id_arch_menu,
                SUM(
                    CASE
                        WHEN y.has_primo = 1
                        AND y.has_secondo = 1
                        AND y.has_contorno = 1
                        AND y.has_ultimo = 1
                        THEN 1 ELSE 0
                    END
                ) AS meals_completed
            FROM (
                SELECT
                    dp.id_arch_menu,
                    dp.id_meal,
                    MAX(f.type = 'primo')    AS has_primo,
                    MAX(f.type = 'secondo')  AS has_secondo,
                    MAX(f.type = 'contorno') AS has_contorno,
                    MAX(f.type = 'ultimo')   AS has_ultimo
                FROM arch_dish_pairing dp
                JOIN arch_meal_snapshot m
                ON m.id_arch_menu = dp.id_arch_menu
                AND m.id_meal      = dp.id_meal
                JOIN arch_food_snapshot f
                ON f.id_arch_food = dp.id_arch_food
                WHERE m.first_choice = 0
                AND dp.used = 1
                GROUP BY dp.id_arch_menu, dp.id_meal
            ) y
            GROUP BY y.id_arch_menu
        ) cm
        ON cm.id_arch_menu = s.id_arch_menu
        ORDER BY s.start_date DESC;
    `);
    return rows;
}

export async function findMenuByID(poolOrConn, id_arch_menu) {
    const [rows] = await poolOrConn.query(
        `
        SELECT
            id_arch_menu,
            season_type,
            DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(end_date, '%Y-%m-%d')   AS end_date,
            day_index
        FROM arch_menu
        WHERE id_arch_menu = ?
        LIMIT 1
        `,
        [id_arch_menu],
    );
    return rows[0] ?? null;
}

export async function getArchivedMealsStatus(poolOrConn, id_arch_menu) {
    const [rows] = await poolOrConn.query(
        `
            SELECT
                m.day_index,
                m.type,
                COALESCE(x.has_primo, 0)     AS has_primo,
                COALESCE(x.has_secondo, 0)   AS has_secondo,
                COALESCE(x.has_contorno, 0)  AS has_contorno,
                COALESCE(x.has_ultimo, 0)    AS has_ultimo,
                CASE
                    WHEN COALESCE(x.has_primo, 0) = 1
                    AND COALESCE(x.has_secondo, 0) = 1
                    AND COALESCE(x.has_contorno, 0) = 1
                    AND COALESCE(x.has_ultimo, 0) = 1
                    THEN 1 ELSE 0
                END AS is_completed
            FROM arch_meal_snapshot m
            LEFT JOIN (
                SELECT
                    dp.id_arch_menu,
                    dp.id_meal,
                    MAX(f.type = 'primo')     AS has_primo,
                    MAX(f.type = 'secondo')   AS has_secondo,
                    MAX(f.type = 'contorno')  AS has_contorno,
                    MAX(f.type = 'ultimo')    AS has_ultimo
                FROM arch_dish_pairing dp
                JOIN arch_food_snapshot f
                ON f.id_arch_food = dp.id_arch_food
                WHERE dp.id_arch_menu = ?
                AND dp.used = 1
                GROUP BY dp.id_arch_menu, dp.id_meal
            ) x
            ON x.id_arch_menu = m.id_arch_menu
            AND x.id_meal      = m.id_meal
            WHERE m.id_arch_menu = ?
            AND m.first_choice = 0
            AND m.day_index BETWEEN 0 AND 27
            ORDER BY m.day_index ASC, FIELD(m.type, 'pranzo', 'cena') ASC;
        `,
        [id_arch_menu, id_arch_menu],
    );
    return rows;
}

export async function getArchivedMenuFixedDishes(poolOrConn, idArchMenu) {
    const [rows] = await poolOrConn.query(
        `
        SELECT DISTINCT
            f.id_food,
            m.type AS pasto,
            f.name,
            f.image_url,
            f.type AS portata,
            f.grammage_tot,
            f.kcal_tot,
            f.proteins,
            f.carbs,
            f.fats,
            f.allergy_notes,
            f.category
        FROM arch_dish_pairing dp
        JOIN arch_meal_snapshot m
            ON m.id_arch_menu = dp.id_arch_menu
           AND m.id_meal      = dp.id_meal
        JOIN arch_food_snapshot f
            ON f.id_arch_food = dp.id_arch_food
        WHERE dp.id_arch_menu = ?
          AND dp.used = 1
          AND (m.first_choice = 1 OR f.type = 'coperto')
        ORDER BY FIELD(m.type, 'pranzo', 'cena'), FIELD(f.type, 'primo','secondo','contorno','ultimo','coperto','speciale'), f.name
        `,
        [idArchMenu],
    );

    return rows;
}

export async function getArchivedFixedCheesesRotation(
    poolOrConn,
    id_arch_menu,
    cheeseIds,
) {
    const [rows] = await poolOrConn.query(
        `
        SELECT
            m.type AS meal_type,
            m.day_index,
            f.id_food,
            f.name
        FROM arch_dish_pairing dp
        JOIN arch_meal_snapshot m
            ON m.id_arch_menu = dp.id_arch_menu
           AND m.id_meal      = dp.id_meal
        JOIN arch_food_snapshot f
            ON f.id_arch_food = dp.id_arch_food
        WHERE dp.id_arch_menu = ?
          AND dp.used = 1
          AND m.first_choice = 1
          AND m.day_index BETWEEN 0 AND 6
          AND f.id_food IN (?)
        `,
        [id_arch_menu, cheeseIds],
    );

    return rows;
}

export async function getArchivedMealComposition(
    poolOrConn,
    { idArchMenu, dayIndex, mealType },
) {
    const [rows] = await poolOrConn.query(
        `
        SELECT
            dp.id_meal,
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
            stats.is_completed
        FROM arch_dish_pairing dp
        JOIN arch_meal_snapshot m
            ON m.id_arch_menu = dp.id_arch_menu
           AND m.id_meal      = dp.id_meal
        JOIN arch_food_snapshot f
            ON f.id_arch_food = dp.id_arch_food
        JOIN (
            SELECT
                m2.id_meal,
                CASE
                    WHEN MAX(f2.type = 'primo')    = 1
                     AND MAX(f2.type = 'secondo') = 1
                     AND MAX(f2.type = 'contorno')= 1
                     AND MAX(f2.type = 'ultimo')  = 1
                    THEN 1 ELSE 0
                END AS is_completed
            FROM arch_dish_pairing dp2
            JOIN arch_meal_snapshot m2
                ON m2.id_arch_menu = dp2.id_arch_menu
               AND m2.id_meal      = dp2.id_meal
            JOIN arch_food_snapshot f2
                ON f2.id_arch_food = dp2.id_arch_food
            WHERE dp2.id_arch_menu = ?
              AND m2.day_index = ?
              AND m2.type = ?
              AND m2.first_choice = 0
              AND dp2.used = 1
            GROUP BY m2.id_meal
        ) stats
            ON stats.id_meal = m.id_meal
        WHERE dp.id_arch_menu = ?
          AND m.day_index = ?
          AND m.type = ?
          AND m.first_choice = 0
          AND dp.used = 1
        ORDER BY f.type ASC, f.name ASC
        `,
        [idArchMenu, dayIndex, mealType, idArchMenu, dayIndex, mealType],
    );

    return rows;
}

// DA CAPIRE SE SERVONO ANCHE QUESTE CHIAMATE
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------

export async function menuExistsBySeasonType(poolOrConn, seasonType) {
    const [rows] = await poolOrConn.query(
        `SELECT 1 FROM season WHERE season_type = ? LIMIT 1`,
        [seasonType],
    );
    return rows.length > 0;
}

export async function checkNameExistsNormalized(
    poolOrConn,
    normalizedName,
    { excludeName } = {},
) {
    const params = [normalizedName];
    let sql = `
        SELECT 1
        FROM season
        WHERE LOWER(TRIM(season_type)) = ?
    `;
    if (excludeName) {
        sql += ` AND LOWER(TRIM(season_type)) <> ?`;
        params.push(excludeName);
    }
    sql += ` LIMIT 1`;

    const [rows] = await poolOrConn.query(sql, params);
    return rows.length > 0;
}

export async function findOverlap(
    poolOrConn,
    { start_date, end_date, excludeName } = {},
) {
    const params = [end_date, start_date];
    let sql = `
        SELECT season_type
        FROM season
        WHERE NOT (? < start_date OR ? > end_date)
    `;
    if (excludeName) {
        sql += ` AND season_type <> ?`;
        params.push(excludeName);
    }
    sql += ` ORDER BY start_date ASC LIMIT 1`;

    const [rows] = await poolOrConn.query(sql, params);
    return rows[0] ?? null;
}

export async function insertMenu(poolOrConn, { name, start_date, end_date }) {
    await poolOrConn.query(
        `INSERT INTO season (season_type, start_date, end_date, day_index) VALUES (?, ?, ?, 0)`,
        [name, start_date, end_date],
    );
}

export async function updateMenuRow(
    poolOrConn,
    { seasonType, start_date, end_date, day_index },
) {
    const [result] = await poolOrConn.query(
        `
        UPDATE season
        SET start_date = ?, end_date = ?, day_index = ?
        WHERE season_type = ?
        `,
        [start_date, end_date, day_index, seasonType],
    );
    return result.affectedRows ?? 0;
}

export async function deleteDishPairingsBySeason(poolOrConn, seasonType) {
    await poolOrConn.query(`DELETE FROM dish_pairing WHERE season_type = ?`, [
        seasonType,
    ]);
}

export async function deleteSeason(poolOrConn, seasonType) {
    const [result] = await poolOrConn.query(
        `DELETE FROM season WHERE season_type = ?`,
        [seasonType],
    );
    return result.affectedRows ?? 0;
}

export async function findMealId(poolOrConn, { dayIndex, mealType }) {
    const [rows] = await poolOrConn.query(
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
    return rows[0]?.id_meal ?? null;
}

export async function deleteMealCompositionNoCoperto(
    poolOrConn,
    { seasonType, idMeal },
) {
    await poolOrConn.query(
        `
        DELETE dp
        FROM dish_pairing dp
        JOIN food f ON f.id_food = dp.id_food
        WHERE dp.season_type = ?
          AND dp.id_meal = ?
          AND f.type <> 'coperto'
        `,
        [seasonType, idMeal],
    );
}

export async function insertDishPairings(poolOrConn, values) {
    await poolOrConn.query(
        `INSERT INTO dish_pairing (id_meal, id_food, season_type, used) VALUES ?`,
        [values],
    );
}

/* ===========================
   PIATTI FISSI + FORMAGGI
   =========================== */

export async function getFixedMeals(poolOrConn) {
    const [rows] = await poolOrConn.query(
        `
        SELECT id_meal, day_index, type
        FROM meal
        WHERE first_choice = 1
          AND day_index BETWEEN 0 AND 27
        ORDER BY day_index ASC, FIELD(type, 'pranzo','cena') ASC
        `,
    );
    return rows;
}

export async function getDailyMeals(poolOrConn) {
    const [rows] = await poolOrConn.query(
        `
        SELECT id_meal, day_index, type
        FROM meal
        WHERE first_choice = 0
          AND day_index BETWEEN 0 AND 27
        ORDER BY day_index ASC, FIELD(type, 'pranzo','cena') ASC
        `,
    );
    return rows;
}

export async function deleteAllFixedPairings(poolOrConn, seasonType) {
    await poolOrConn.query(
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
}

export async function deleteDailyCoperti(poolOrConn, seasonType) {
    await poolOrConn.query(
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
}
