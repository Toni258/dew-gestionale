import { pool } from '../db/db.js';
import { HttpError } from '../utils/httpError.js';
import { decodeTrim, parseIntStrict, oneOf } from '../utils/params.js';
import * as repo from '../repositories/archivedMenusRepo.js';
import { CHEESE_IDS } from '../../shared/constants.js';

export async function getMenus() {
    return repo.listMenus(pool);
}

export async function getArchivedMenuByID(id_arch_menu_param) {
    const id_arch_menu = decodeTrim(id_arch_menu_param);
    if (!id_arch_menu) throw new HttpError(400, 'id_arch_menu non valido');

    const menu = await repo.findMenuByID(pool, id_arch_menu);
    if (!menu) throw new HttpError(404, 'Menù non trovato');

    return menu;
}

export async function getArchivedMenuMealsStatus(id_arch_menu_param) {
    const idArchMenu = parseIntStrict(id_arch_menu_param, {
        message: 'id_arch_menu non valido',
    });

    return repo.getArchivedMealsStatus(pool, idArchMenu);
}

export async function getArchivedMenuFixedDishes(idArchMenuRaw) {
    const idArchMenu = parseIntStrict(idArchMenuRaw, {
        message: 'id_arch_menu non valido',
    });

    const rows = await repo.getArchivedMenuFixedDishes(pool, idArchMenu);
    return { data: rows };
}

export async function getArchivedMenuFixedCheesesRotation(idArchMenuRaw) {
    const idArchMenu = parseIntStrict(idArchMenuRaw, {
        message: 'id_arch_menu non valido',
    });
    const rows = await repo.getArchivedFixedCheesesRotation(
        pool,
        idArchMenu,
        CHEESE_IDS,
    );

    const out = { pranzo: Array(7).fill(null), cena: Array(7).fill(null) };

    for (const row of rows) {
        const mealType = row.meal_type;
        const dayIndex = Number(row.day_index);

        if (!out[mealType]) continue;
        if (dayIndex < 0 || dayIndex > 6) continue;

        out[mealType][dayIndex] = {
            id_food: row.id_food,
            name: row.name,
        };
    }

    return { data: out };
}

export async function getArchivedMenuMealComposition({
    id_arch_menu_param,
    day_index_param,
    meal_type_param,
}) {
    const idArchMenu = parseIntStrict(id_arch_menu_param, {
        message: 'id_arch_menu non valido',
    });

    const dayIndex = parseIntStrict(day_index_param, {
        min: 0,
        max: 27,
        message: 'day_index non valido',
    });

    const mealType = oneOf(
        meal_type_param,
        ['pranzo', 'cena'],
        'Tipo pasto non valido',
    );

    const dishes = await repo.getArchivedMealComposition(pool, {
        idArchMenu,
        dayIndex,
        mealType,
    });

    return {
        id_arch_menu: idArchMenu,
        day_index: dayIndex,
        meal_type: mealType,
        dishes,
    };
}
