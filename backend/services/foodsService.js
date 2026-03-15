import { pool } from '../db/db.js';
import { HttpError } from '../utils/httpError.js';
import { COURSE_TYPES, MEAL_TYPES, CHEESE_IDS, CHEESE_IDS_SQL_ORDER } from '../../shared/constants.js';
import {
    listCheeseFoods,
    listFoodsAvailableForMenu,
    listFoodsByType,
} from '../repositories/foodsRepo.js';

export async function getFoodsByType(query = {}) {
    const type = String(query.type ?? '').trim();
    const search = String(query.search ?? '').trim();

    if (!type) {
        throw new HttpError(400, 'Parametro "type" obbligatorio');
    }

    const allowedTypes = COURSE_TYPES.filter((courseType) =>
        ['primo', 'secondo', 'contorno', 'ultimo'].includes(courseType),
    );

    if (!allowedTypes.includes(type)) {
        throw new HttpError(400, 'Tipo di piatto non valido');
    }

    return { data: await listFoodsByType(pool, { type, search }) };
}

export async function getFoodsAvailableForMenuData(query = {}) {
    const type = String(query.type ?? '').trim();
    const seasonType = String(query.season_type ?? '').trim();
    const mealType = String(query.meal_type ?? '').trim();
    const search = String(query.search ?? '').trim();
    const dateFrom = String(query.date_from ?? '').trim();
    const dateTo = String(query.date_to ?? '').trim();
    const excludeIdFood = Number(query.exclude_id_food) || 0;

    if (!type || !seasonType || !mealType) {
        throw new HttpError(400, 'Parametri obbligatori: type, season_type, meal_type');
    }

    if (!COURSE_TYPES.includes(type)) {
        throw new HttpError(400, 'Tipo di piatto non valido');
    }

    if (!MEAL_TYPES.includes(mealType)) {
        throw new HttpError(400, 'Tipo pasto non valido');
    }

    return {
        data: await listFoodsAvailableForMenu(pool, {
            type,
            seasonType,
            mealType,
            search,
            dateFrom,
            dateTo,
            excludeIdFood,
        }),
    };
}

export async function getCheeseFoodsData() {
    return {
        data: await listCheeseFoods(pool, CHEESE_IDS, CHEESE_IDS_SQL_ORDER),
    };
}
