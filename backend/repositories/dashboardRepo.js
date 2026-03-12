export async function listMenuSummaries(poolOrConn) {
    const [rows] = await poolOrConn.query(
        `
            SELECT
                s.season_type,
                DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(s.end_date,   '%Y-%m-%d') AS end_date,
                CONCAT(
                    DATE_FORMAT(s.start_date, '%d.%m.%Y'),
                    ' - ',
                    DATE_FORMAT(s.end_date,   '%d.%m.%Y')
                ) AS period_label,
                DATEDIFF(s.start_date, CURDATE()) AS days_until_start,
                DATEDIFF(s.end_date,   CURDATE()) AS days_until_end,
                CASE
                    WHEN CURDATE() BETWEEN s.start_date AND s.end_date THEN 1
                    ELSE 0
                END AS is_current,
                CASE
                    WHEN s.start_date > CURDATE() THEN 1
                    ELSE 0
                END AS is_future,
                CASE
                    WHEN s.end_date < CURDATE() THEN 1
                    ELSE 0
                END AS is_ended,
                daily_expected.meals_total,
                COALESCE(dm.meals_compiled, 0) AS meals_compiled,
                fixed_expected.fixed_slots_total,
                COALESCE(fs.fixed_slots_filled, 0) AS fixed_slots_filled
            FROM season s
            CROSS JOIN (
                SELECT COUNT(*) AS meals_total
                FROM meal
                WHERE first_choice = 0
                  AND day_index BETWEEN 0 AND 27
            ) daily_expected
            CROSS JOIN (
                SELECT 39 AS fixed_slots_total
            ) fixed_expected
            LEFT JOIN (
                SELECT
                    x.season_type,
                    COUNT(*) AS meals_compiled
                FROM (
                    SELECT
                        dp.season_type,
                        dp.id_meal
                    FROM dish_pairing dp
                    JOIN meal m ON m.id_meal = dp.id_meal
                    JOIN food f ON f.id_food = dp.id_food
                    WHERE dp.used = 1
                      AND m.first_choice = 0
                      AND m.day_index BETWEEN 0 AND 27
                      AND f.type IN ('primo', 'secondo', 'contorno', 'ultimo')
                    GROUP BY dp.season_type, dp.id_meal
                ) x
                GROUP BY x.season_type
            ) dm ON dm.season_type = s.season_type
            LEFT JOIN (
                SELECT
                    x.season_type,
                    (
                        x.pranzo_primo
                        + x.pranzo_secondo_fisso
                        + x.pranzo_formaggi_rotazione
                        + x.pranzo_contorno
                        + x.pranzo_ultimo
                        + x.pranzo_coperto
                        + x.cena_primo
                        + x.cena_secondo_fisso
                        + x.cena_formaggi_rotazione
                        + x.cena_contorno
                        + x.cena_ultimo
                        + x.cena_coperto
                        + x.cena_speciale
                    ) AS fixed_slots_filled
                FROM (
                    SELECT
                        dp.season_type,

                        LEAST(
                            COUNT(DISTINCT CASE
                                WHEN m.type = 'pranzo' AND f.type = 'primo'
                                THEN dp.id_food
                            END),
                            3
                        ) AS pranzo_primo,

                        LEAST(
                            COUNT(DISTINCT CASE
                                WHEN m.type = 'pranzo'
                                 AND f.type = 'secondo'
                                 AND dp.id_food NOT IN (195, 196, 197)
                                THEN dp.id_food
                            END),
                            2
                        ) AS pranzo_secondo_fisso,

                        LEAST(
                            COUNT(DISTINCT CASE
                                WHEN m.type = 'pranzo'
                                 AND dp.id_food IN (195, 196, 197)
                                THEN MOD(m.day_index, 7)
                            END),
                            7
                        ) AS pranzo_formaggi_rotazione,

                        LEAST(
                            COUNT(DISTINCT CASE
                                WHEN m.type = 'pranzo' AND f.type = 'contorno'
                                THEN dp.id_food
                            END),
                            3
                        ) AS pranzo_contorno,

                        LEAST(
                            COUNT(DISTINCT CASE
                                WHEN m.type = 'pranzo' AND f.type = 'ultimo'
                                THEN dp.id_food
                            END),
                            3
                        ) AS pranzo_ultimo,

                        LEAST(
                            COUNT(DISTINCT CASE
                                WHEN m.type = 'pranzo' AND f.type = 'coperto'
                                THEN dp.id_food
                            END),
                            1
                        ) AS pranzo_coperto,

                        LEAST(
                            COUNT(DISTINCT CASE
                                WHEN m.type = 'cena' AND f.type = 'primo'
                                THEN dp.id_food
                            END),
                            3
                        ) AS cena_primo,

                        LEAST(
                            COUNT(DISTINCT CASE
                                WHEN m.type = 'cena'
                                 AND f.type = 'secondo'
                                 AND dp.id_food NOT IN (195, 196, 197)
                                THEN dp.id_food
                            END),
                            2
                        ) AS cena_secondo_fisso,

                        LEAST(
                            COUNT(DISTINCT CASE
                                WHEN m.type = 'cena'
                                 AND dp.id_food IN (195, 196, 197)
                                THEN MOD(m.day_index, 7)
                            END),
                            7
                        ) AS cena_formaggi_rotazione,

                        LEAST(
                            COUNT(DISTINCT CASE
                                WHEN m.type = 'cena' AND f.type = 'contorno'
                                THEN dp.id_food
                            END),
                            3
                        ) AS cena_contorno,

                        LEAST(
                            COUNT(DISTINCT CASE
                                WHEN m.type = 'cena' AND f.type = 'ultimo'
                                THEN dp.id_food
                            END),
                            3
                        ) AS cena_ultimo,

                        LEAST(
                            COUNT(DISTINCT CASE
                                WHEN m.type = 'cena' AND f.type = 'coperto'
                                THEN dp.id_food
                            END),
                            1
                        ) AS cena_coperto,

                        LEAST(
                            COUNT(DISTINCT CASE
                                WHEN m.type = 'cena' AND f.type = 'speciale'
                                THEN dp.id_food
                            END),
                            1
                        ) AS cena_speciale

                    FROM dish_pairing dp
                    JOIN meal m
                        ON m.id_meal = dp.id_meal
                    JOIN food f
                        ON f.id_food = dp.id_food
                    WHERE dp.used = 1
                      AND (
                            m.first_choice = 1
                            OR f.type = 'coperto'
                        )
                      AND m.day_index BETWEEN 0 AND 27
                    GROUP BY dp.season_type
                ) x
            ) fs ON fs.season_type = s.season_type
            ORDER BY s.start_date ASC
        `,
    );

    return rows;
}

export async function listIncompleteMeals(poolOrConn, seasonType) {
    const [rows] = await poolOrConn.query(
        `
            SELECT
                m.day_index,
                m.type,
                COALESCE(MAX(CASE WHEN f.type = 'primo' THEN 1 ELSE 0 END), 0) AS has_primo,
                COALESCE(MAX(CASE WHEN f.type = 'secondo' THEN 1 ELSE 0 END), 0) AS has_secondo,
                COALESCE(MAX(CASE WHEN f.type = 'contorno' THEN 1 ELSE 0 END), 0) AS has_contorno,
                COALESCE(MAX(CASE WHEN f.type = 'ultimo' THEN 1 ELSE 0 END), 0) AS has_ultimo
            FROM meal m
            LEFT JOIN dish_pairing dp
                ON dp.id_meal = m.id_meal
            AND dp.season_type = ?
            AND dp.used = 1
            LEFT JOIN food f
                ON f.id_food = dp.id_food
            WHERE m.first_choice = 0
            AND m.day_index BETWEEN 0 AND 27
            GROUP BY m.id_meal, m.day_index, m.type
            HAVING has_primo = 0
            AND has_secondo = 0
            AND has_contorno = 0
            AND has_ultimo = 0
            ORDER BY m.day_index ASC, FIELD(m.type, 'pranzo', 'cena') ASC
        `,
        [seasonType],
    );

    return rows;
}

export async function listActiveSuspensions(poolOrConn) {
    const [rows] = await poolOrConn.query(
        `
            SELECT
                fa.id_avail,
                fa.id_food,
                f.name,
                f.type,
                DATE_FORMAT(fa.valid_from, '%Y-%m-%d') AS valid_from,
                DATE_FORMAT(fa.valid_to,   '%Y-%m-%d') AS valid_to,
                fa.reason,
                fa.restored_at,
                DATEDIFF(DATE(fa.valid_to), CURDATE()) AS days_until_reactivation
            FROM food_availability fa
            JOIN food f ON f.id_food = fa.id_food
            WHERE fa.restored_at IS NULL
            ORDER BY
                CASE
                    WHEN NOW() BETWEEN fa.valid_from AND fa.valid_to THEN 0
                    ELSE 1
                END,
                fa.valid_to ASC,
                f.name ASC
        `,
    );

    return rows;
}

export async function listReplacementCandidatesForSuspension(
    poolOrConn,
    { idFood, validFrom, validTo },
) {
    const [rows] = await poolOrConn.query(
        `
            SELECT
                nf.id_food,
                nf.name,
                COUNT(*) AS occurrences
            FROM dish_pairing old_dp
            JOIN food old_f
                ON old_f.id_food = old_dp.id_food
            JOIN season s
                ON s.season_type = old_dp.season_type
            JOIN dish_pairing new_dp
                ON new_dp.season_type = old_dp.season_type
            AND new_dp.id_meal = old_dp.id_meal
            AND new_dp.used = 1
            AND new_dp.id_food <> old_dp.id_food
            JOIN food nf
                ON nf.id_food = new_dp.id_food
            AND nf.type = old_f.type
            WHERE old_dp.id_food = ?
            AND old_dp.used = 0
            AND s.start_date <= ?
            AND s.end_date >= ?
            GROUP BY nf.id_food, nf.name
            ORDER BY occurrences DESC, nf.name ASC
        `,
        [idFood, validTo, validFrom],
    );

    return rows;
}
