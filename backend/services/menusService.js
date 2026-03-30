// Service layer used for menus.
import { pool } from '../db/db.js';
import { withTransaction } from '../db/tx.js';
import { HttpError } from '../utils/httpError.js';
import {
    decodeTrim,
    normalizeName,
    parseIntStrict,
    oneOf,
} from '../utils/params.js';
import * as repo from '../repositories/menusRepo.js';
import { CHEESE_IDS } from '../../shared/constants.js';

// Returns the data used by menus.
export async function getMenus() {
    return repo.listMenus(pool);
}

// Checks the current value for menu name.
export async function checkMenuName({ name, excludeName }) {
    const normalized = normalizeName(name);
    if (!normalized) return { exists: false };

    const excludeNorm = excludeName ? normalizeName(excludeName) : '';
    const exists = await repo.checkNameExistsNormalized(pool, normalized, {
        excludeName: excludeNorm || undefined,
    });

    return { exists };
}

// Checks the current value for menu dates overlap.
export async function checkMenuDatesOverlap({
    start_date,
    end_date,
    excludeName,
    excludeArchMenuId,
}) {
    if (!start_date || !end_date) return { overlap: false };
    if (end_date < start_date) return { overlap: false };

    const found = await repo.findOverlap(pool, {
        start_date,
        end_date,
        excludeName,
        excludeArchMenuId,
    });

    if (!found) return { overlap: false };

    // Formats the value used by date.
    function formatDate(d) {
        if (!d) return null;
        return d.toISOString().slice(0, 10); // YYYY-MM-DD
    }

    return {
        overlap: true,
        source: found.source,
        season_type: found.season_type,
        start_date: formatDate(found.start_date),
        end_date: formatDate(found.end_date),
        id_arch_menu: found.id_arch_menu,
    };
}

// Returns the data used by menu by season type.
export async function getMenuBySeasonType(season_type_param) {
    const seasonType = decodeTrim(season_type_param);
    if (!seasonType) throw new HttpError(400, 'season_type non valido');

    const menu = await repo.findMenuBySeasonType(pool, seasonType);
    if (!menu) throw new HttpError(404, 'Menù non trovato');

    return menu;
}

// Returns the data used by menu meals status.
export async function getMenuMealsStatus(season_type_param) {
    const seasonType = decodeTrim(season_type_param);
    if (!seasonType) throw new HttpError(400, 'season_type non valido');

    return repo.getMealsStatus(pool, seasonType);
}

// Creates the data for menu.
export async function createMenu({ name, start_date, end_date }) {
    const menuName = String(name ?? '').trim();
    if (!menuName || menuName.length < 3)
        throw new HttpError(400, 'Nome non valido');
    if (!start_date || !end_date) throw new HttpError(400, 'Date non valide');
    if (end_date < start_date)
        throw new HttpError(400, 'La data fine deve essere >= data inizio');

    try {
        await repo.insertMenu(pool, { name: menuName, start_date, end_date });
        return { success: true };
    } catch (err) {
        if (err?.code === 'ER_DUP_ENTRY')
            throw new HttpError(409, 'Nome menù già esistente');
        throw err;
    }
}

// Updates the data for menu.
export async function updateMenu(
    season_type_param,
    { start_date, end_date, day_index },
) {
    const seasonType = decodeTrim(season_type_param);
    if (!seasonType) throw new HttpError(400, 'season_type non valido');

    if (!start_date || !end_date) throw new HttpError(400, 'Date non valide');
    if (end_date < start_date)
        throw new HttpError(400, 'La data fine deve essere >= data inizio');

    const dayIndex = parseIntStrict(day_index, {
        min: 0,
        max: 27,
        message: 'day_index non valido',
    });

    const ov = await repo.findOverlap(pool, {
        start_date,
        end_date,
        excludeName: seasonType,
    });
    if (ov) {
        throw new HttpError(
            409,
            `Intervallo già usato nel menù "${ov.season_type}"`,
            {
                season_type: ov.season_type,
            },
        );
    }

    const affected = await repo.updateMenuRow(pool, {
        seasonType,
        start_date,
        end_date,
        day_index: dayIndex,
    });

    if (affected === 0) throw new HttpError(404, 'Menù non trovato');
    return { success: true };
}

// Deletes the data for menu.
export async function deleteMenu(season_type_param) {
    const seasonType = decodeTrim(season_type_param);
    if (!seasonType) throw new HttpError(400, 'season_type non valido');

    return withTransaction(async (conn) => {
        await repo.deleteDishPairingsBySeason(conn, seasonType);
        const affected = await repo.deleteSeason(conn, seasonType);
        if (affected === 0) throw new HttpError(404, 'Menù non trovato');
        return { success: true };
    });
}

// Returns the data used by menu meal composition.
export async function getMenuMealComposition({
    season_type_param,
    day_index_param,
    meal_type_param,
}) {
    const seasonType = decodeTrim(season_type_param);
    const dayIndex = parseIntStrict(day_index_param, {
        message: 'Parametri non validi',
    });
    const mealType = oneOf(
        meal_type_param,
        ['pranzo', 'cena'],
        'Tipo pasto non valido',
    );

    const dishes = await repo.getMealComposition(pool, {
        seasonType,
        dayIndex,
        mealType,
    });

    return {
        season_type: seasonType,
        day_index: dayIndex,
        meal_type: mealType,
        dishes,
    };
}

// Helper function used by upsert menu meal composition.
export async function upsertMenuMealComposition({
    season_type_param,
    day_index_param,
    meal_type_param,
    body,
}) {
    const seasonType = decodeTrim(season_type_param);
    const dayIndex = parseIntStrict(day_index_param, {
        min: 0,
        max: 27,
        message: 'day_index non valido',
    });
    const mealType = oneOf(
        meal_type_param,
        ['pranzo', 'cena'],
        'meal_type non valido',
    );
    if (!seasonType) throw new HttpError(400, 'season_type non valido');

    const foods = body?.foods ?? body;
    const allowedKeys = ['primo', 'secondo', 'contorno', 'ultimo'];

    // prendo solo i campi valorizzati
    const selectedEntries = allowedKeys
        .map((k) => [k, foods?.[k] ?? null])
        .filter(([, v]) => v !== null && v !== undefined && v !== '');

    const ids = selectedEntries.map(([, v]) => Number(v));

    if (ids.some((x) => !Number.isInteger(x) || x <= 0)) {
        throw new HttpError(400, 'id_food non validi');
    }

    const unique = new Set(ids);
    if (unique.size !== ids.length) {
        throw new HttpError(400, 'Hai selezionato lo stesso piatto più volte');
    }

    return withTransaction(async (conn) => {
        const exists = await repo.menuExistsBySeasonType(conn, seasonType);
        if (!exists) throw new HttpError(404, 'Menù non trovato');

        const idMeal = await repo.findMealId(conn, { dayIndex, mealType });
        if (!idMeal) throw new HttpError(404, 'Meal non trovato');

        await repo.deleteMealCompositionNoCoperto(conn, { seasonType, idMeal });

        if (ids.length > 0) {
            const values = ids.map((idFood) => [idMeal, idFood, seasonType, 1]);
            await repo.insertDishPairings(conn, values);
        }

        return { ok: true };
    });
}

// ===========================
// PIATTI FISSI + FORMAGGI
// ===========================

// Returns the data used by menu fixed dishes.
export async function getMenuFixedDishes(season_type_param) {
    const seasonType = decodeTrim(season_type_param);
    if (!seasonType) throw new HttpError(400, 'season_type non valido');

    const rows = await repo.getMenuFixedDishes(pool, seasonType);
    return { data: rows };
}

// Returns the data used by fixed cheeses rotation.
export async function getFixedCheesesRotation(season_type_param) {
    const seasonType = decodeTrim(season_type_param);
    if (!seasonType) throw new HttpError(400, 'season_type non valido');

    const rows = await repo.getFixedCheesesRotation(
        pool,
        seasonType,
        CHEESE_IDS,
    );

    const out = {
        pranzo: Array(7).fill(null),
        cena: Array(7).fill(null),
    };

    for (const r of rows) {
        const idx = Number(r.day_index);
        if (idx < 0 || idx > 6) continue;
        if (r.meal_type !== 'pranzo' && r.meal_type !== 'cena') continue;

        out[r.meal_type][idx] = {
            id_food: r.id_food,
            name: r.name,
        };
    }

    return { data: out };
}

// Validates the data used by cheese rotation.
function validateCheeseRotation(rot) {
    if (!rot || typeof rot !== 'object') return 'FORMAGGI: blocco mancante';
    if (!Array.isArray(rot.pranzo) || rot.pranzo.length !== 7)
        return 'FORMAGGI: pranzo deve avere 7 elementi';
    if (!Array.isArray(rot.cena) || rot.cena.length !== 7)
        return 'FORMAGGI: cena deve avere 7 elementi';

    const all = [...rot.pranzo, ...rot.cena].map((x) => Number(x));
    if (all.some((n) => !Number.isInteger(n) || n <= 0))
        return 'FORMAGGI: valori non validi';
    if (all.some((n) => !CHEESE_IDS.includes(n)))
        return 'FORMAGGI: id non ammesso (usa solo 195/196/197)';

    return null;
}

// Converts the input into ids.
function toIds(arr) {
    if (!Array.isArray(arr)) return [];
    return arr
        .map((x) =>
            x && typeof x === 'object' ? Number(x.id_food) : Number(x),
        )
        .filter((n) => Number.isInteger(n) && n > 0);
}

// Validates the data used by block.
function validateBlock(block, keys, label) {
    for (const k of keys) {
        if (!Array.isArray(block[k]))
            return `${label}: campo "${k}" mancante o non valido`;

        const ids = block[k].map((x) =>
            x && typeof x === 'object' ? Number(x.id_food) : Number(x),
        );

        if (k === 'secondo') {
            if (ids.length < 2)
                return `${label}: campo "secondo" incompleto (servono almeno 2 piatti)`;
            const firstTwo = ids.slice(0, 2);
            if (firstTwo.some((n) => !Number.isInteger(n) || n <= 0)) {
                return `${label}: campo "secondo" incompleto (i primi 2 sono obbligatori)`;
            }
            continue; // terzo opzionale
        }

        if (ids.some((n) => !Number.isInteger(n) || n <= 0))
            return `${label}: campo "${k}" incompleto`;
    }
    return null;
}

// Helper function used by upsert menu fixed dishes.
export async function upsertMenuFixedDishes(season_type_param, body) {
    const seasonType = decodeTrim(season_type_param);
    if (!seasonType) throw new HttpError(400, 'season_type non valido');

    const pranzo = body?.pranzo ?? {};
    const cena = body?.cena ?? {};
    const formaggi_rotation = body?.formaggi_rotation ?? null;

    const rotErr = validateCheeseRotation(formaggi_rotation);
    if (rotErr) throw new HttpError(400, rotErr);

    const requiredLunch = ['primo', 'secondo', 'contorno', 'ultimo', 'coperto'];
    const requiredDinner = [
        'primo',
        'secondo',
        'contorno',
        'ultimo',
        'coperto',
        'speciale',
    ];

    const errLunch = validateBlock(pranzo, requiredLunch, 'PRANZO');
    if (errLunch) throw new HttpError(400, errLunch);

    const errDinner = validateBlock(cena, requiredDinner, 'CENA');
    if (errDinner) throw new HttpError(400, errDinner);

    const idsLunch = {
        primo: toIds(pranzo.primo),
        secondo: toIds(pranzo.secondo),
        contorno: toIds(pranzo.contorno),
        ultimo: toIds(pranzo.ultimo),
        coperto: toIds(pranzo.coperto),
    };

    const idsDinner = {
        primo: toIds(cena.primo),
        secondo: toIds(cena.secondo),
        contorno: toIds(cena.contorno),
        ultimo: toIds(cena.ultimo),
        coperto: toIds(cena.coperto),
        speciale: toIds(cena.speciale),
    };

    return withTransaction(async (conn) => {
        const exists = await repo.menuExistsBySeasonType(conn, seasonType);
        if (!exists) throw new HttpError(404, 'Menù non trovato');

        const fixedMeals = await repo.getFixedMeals(conn);
        const dailyMeals = await repo.getDailyMeals(conn);

        if (fixedMeals.length === 0 || dailyMeals.length === 0) {
            throw new HttpError(500, 'Tabella meal non popolata correttamente');
        }

        // DELETE fixed + delete coperti daily
        await repo.deleteAllFixedPairings(conn, seasonType);
        await repo.deleteDailyCoperti(conn, seasonType);

        const values = [];

        // INSERT fixed meals (no coperto) + formaggio rotazione
        for (const m of fixedMeals) {
            const isLunch = m.type === 'pranzo';
            const src = isLunch ? idsLunch : idsDinner;

            const allIdsNoCoperto = [
                ...src.primo,
                ...src.secondo.slice(0, 2), // solo primi 2
                ...src.contorno,
                ...src.ultimo,
                ...(isLunch ? [] : src.speciale),
            ];

            for (const idFood of allIdsNoCoperto) {
                values.push([m.id_meal, idFood, seasonType, 1]);
            }

            const weekday = Number(m.day_index) % 7; // 0..6
            const cheeseId =
                m.type === 'pranzo'
                    ? Number(formaggi_rotation.pranzo[weekday])
                    : Number(formaggi_rotation.cena[weekday]);

            values.push([m.id_meal, cheeseId, seasonType, 1]);
        }

        // INSERT coperto sui daily meals (first_choice=0)
        const copertoLunchId = Number(idsLunch.coperto?.[0] ?? 0);
        const copertoDinnerId = Number(idsDinner.coperto?.[0] ?? 0);

        if (!Number.isInteger(copertoLunchId) || copertoLunchId <= 0) {
            throw new HttpError(400, 'PRANZO: coperto non valido');
        }
        if (!Number.isInteger(copertoDinnerId) || copertoDinnerId <= 0) {
            throw new HttpError(400, 'CENA: coperto non valido');
        }

        for (const m of dailyMeals) {
            const idFood =
                m.type === 'pranzo' ? copertoLunchId : copertoDinnerId;
            values.push([m.id_meal, idFood, seasonType, 1]);
        }

        if (values.length === 0)
            throw new HttpError(400, 'Nessun piatto da salvare');

        await repo.insertDishPairings(conn, values);
        return { ok: true, inserted: values.length };
    });
}

// Helper function used by archive menu.
export async function archiveMenu(season_type_param) {
    const seasonType = decodeTrim(season_type_param);
    if (!seasonType) throw new HttpError(400, 'season_type non valido');

    const exists = await repo.menuExistsBySeasonType(pool, seasonType);
    if (!exists) throw new HttpError(404, 'Menù non trovato');

    await repo.archiveMenuBySeasonType(pool, seasonType);

    return { success: true };
}
