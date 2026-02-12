export async function listMenus(poolOrConn) {
    const [rows] = await poolOrConn.query(`
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
                y.season_type,
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
                    dp.season_type,
                    dp.id_meal,
                    MAX(f.type = 'primo')    AS has_primo,
                    MAX(f.type = 'secondo')  AS has_secondo,
                    MAX(f.type = 'contorno') AS has_contorno,
                    MAX(f.type = 'ultimo')   AS has_ultimo
                FROM dish_pairing dp
                JOIN meal m ON m.id_meal = dp.id_meal
                JOIN food f ON f.id_food = dp.id_food
                WHERE m.first_choice = 0
                  AND dp.used = 1
                GROUP BY dp.season_type, dp.id_meal
            ) y
            GROUP BY y.season_type
        ) cm ON cm.season_type = s.season_type
        ORDER BY s.start_date ASC;
    `);
    return rows;
}

export async function menuExistsBySeasonType(poolOrConn, seasonType) {
    const [rows] = await poolOrConn.query(
        `SELECT 1 FROM season WHERE season_type = ? LIMIT 1`,
        [seasonType],
    );
    return rows.length > 0;
}

export async function findMenuBySeasonType(poolOrConn, seasonType) {
    const [rows] = await poolOrConn.query(
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
    return rows[0] ?? null;
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

export async function getMealsStatus(poolOrConn, seasonType) {
    const [rows] = await poolOrConn.query(
        `
        SELECT
            m.day_index,
            m.type,
            COALESCE(x.has_primo, 0)     AS has_primo,
            COALESCE(x.has_secondo, 0)  AS has_secondo,
            COALESCE(x.has_contorno, 0) AS has_contorno,
            COALESCE(x.has_ultimo, 0)   AS has_ultimo,
            CASE
                WHEN COALESCE(x.has_primo, 0) = 1
                 AND COALESCE(x.has_secondo, 0) = 1
                 AND COALESCE(x.has_contorno, 0) = 1
                 AND COALESCE(x.has_ultimo, 0) = 1
                THEN 1 ELSE 0
            END AS is_completed
        FROM meal m
        LEFT JOIN (
            SELECT
                dp.id_meal,
                MAX(f.type = 'primo')     AS has_primo,
                MAX(f.type = 'secondo')   AS has_secondo,
                MAX(f.type = 'contorno')  AS has_contorno,
                MAX(f.type = 'ultimo')    AS has_ultimo
            FROM dish_pairing dp
            JOIN food f ON f.id_food = dp.id_food
            WHERE dp.season_type = ?
              AND dp.used = 1
            GROUP BY dp.id_meal
        ) x ON x.id_meal = m.id_meal
        WHERE m.first_choice = 0
          AND m.day_index BETWEEN 0 AND 27
        ORDER BY m.day_index ASC, FIELD(m.type, 'pranzo', 'cena') ASC
        `,
        [seasonType],
    );
    return rows;
}

export async function getMealComposition(
    poolOrConn,
    { seasonType, dayIndex, mealType },
) {
    const [rows] = await poolOrConn.query(
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
            stats.is_completed
        FROM dish_pairing dp
        JOIN meal m ON m.id_meal = dp.id_meal
        JOIN food f ON f.id_food = dp.id_food
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
            FROM dish_pairing dp2
            JOIN meal m2 ON m2.id_meal = dp2.id_meal
            JOIN food f2 ON f2.id_food = dp2.id_food
            WHERE dp2.season_type = ?
              AND m2.day_index = ?
              AND m2.type = ?
              AND m2.first_choice = 0
              AND dp2.used = 1
            GROUP BY m2.id_meal
        ) stats ON stats.id_meal = m.id_meal
        WHERE dp.season_type = ?
          AND m.day_index = ?
          AND m.type = ?
          AND m.first_choice = 0
          AND dp.used = 1
        ORDER BY dp.id_dish_pairing ASC
        `,
        [seasonType, dayIndex, mealType, seasonType, dayIndex, mealType],
    );
    return rows;
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

export async function getMenuFixedDishes(poolOrConn, seasonType) {
    const [rows] = await poolOrConn.query(
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
    return rows;
}

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

export async function getFixedCheesesRotation(
    poolOrConn,
    seasonType,
    cheeseIds,
) {
    const [rows] = await poolOrConn.query(
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
        [seasonType, cheeseIds],
    );
    return rows;
}
