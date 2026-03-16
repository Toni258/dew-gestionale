// Database queries used for foods.
export async function listFoodsByType(poolOrConn, { type, search = '' }) {
    const [rows] = await poolOrConn.query(
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
            WHERE type = ?
              AND name LIKE ?
            ORDER BY name ASC
        `,
        [type, `%${search}%`],
    );

    return rows;
}

// Returns the list used by foods available for menu.
export async function listFoodsAvailableForMenu(
    poolOrConn,
    {
        type,
        seasonType,
        mealType,
        search = '',
        dateFrom = '',
        dateTo = '',
        excludeIdFood = 0,
    },
) {
    const useRange = dateFrom && dateTo && dateTo >= dateFrom;

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
              seasonType,
              mealType,
              dateTo,
              dateFrom,
          ]
        : [
              type,
              `%${search}%`,
              excludeIdFood,
              excludeIdFood,
              seasonType,
              mealType,
          ];

    const [rows] = await poolOrConn.query(sql, params);
    return rows;
}

// Returns the list used by cheese foods.
export async function listCheeseFoods(poolOrConn, cheeseIds, orderSqlList) {
    const [rows] = await poolOrConn.query(
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
            ORDER BY FIELD(id_food, ${orderSqlList})
        `,
        [cheeseIds],
    );

    return rows;
}