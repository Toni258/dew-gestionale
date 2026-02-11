import { COURSE_ROWS } from './constants';

export function makeEmptySelected() {
    const base = { pranzo: {}, cena: {} };
    for (const row of COURSE_ROWS) {
        base.pranzo[row.key] = Array(row.slots).fill(null);
        base.cena[row.key] = Array(row.slots).fill(null);
    }
    // speciale NON esiste a pranzo
    base.pranzo.speciale = [];
    return base;
}

export function makeEmptyCheeseRotation() {
    return { pranzo: Array(7).fill(null), cena: Array(7).fill(null) };
}

export function ensureInOptions(optionsMap, meal, courseKey, food) {
    if (!food?.id_food) return;
    const list = optionsMap?.[meal]?.[courseKey];
    if (!Array.isArray(list)) return;

    const exists = list.some((x) => Number(x.id_food) === Number(food.id_food));
    if (!exists) list.unshift(food);
}

export function toIdsArray(arr) {
    return (arr ?? []).map((f) => Number(f?.id_food ?? 0));
}

export function getMissingFields(selected) {
    const missing = [];

    for (const row of COURSE_ROWS) {
        const courseKey = row.key;
        const pranzoSlots = courseKey === 'speciale' ? 0 : row.slots;
        const cenaSlots = row.slots;

        // PRANZO
        for (let i = 0; i < pranzoSlots; i++) {
            if (courseKey === 'secondo' && i === 2) continue; // non obbligatorio
            const food = selected.pranzo?.[courseKey]?.[i] ?? null;
            if (!food?.id_food) missing.push(`PRANZO - ${row.label} #${i + 1}`);
        }

        // CENA
        for (let i = 0; i < cenaSlots; i++) {
            if (courseKey === 'secondo' && i === 2) continue; // non obbligatorio
            const food = selected.cena?.[courseKey]?.[i] ?? null;
            if (!food?.id_food) missing.push(`CENA - ${row.label} #${i + 1}`);
        }
    }

    return missing;
}

function getUsedIdsForMeal(selectedFoodsState, meal, { skip } = {}) {
    const ids = [];

    for (const row of COURSE_ROWS) {
        const courseKey = row.key;
        if (meal === 'pranzo' && courseKey === 'speciale') continue;

        const arr = selectedFoodsState?.[meal]?.[courseKey] ?? [];
        for (let i = 0; i < arr.length; i++) {
            if (courseKey === 'secondo' && i === 2) continue;

            if (
                skip &&
                skip.meal === meal &&
                skip.courseKey === courseKey &&
                skip.idx === i
            ) {
                continue;
            }

            const id = Number(arr[i]?.id_food ?? 0);
            if (Number.isInteger(id) && id > 0) ids.push(id);
        }
    }

    return new Set(ids);
}

export function isDuplicateInMeal(selectedFoodsState, meal, idFood, skip) {
    const used = getUsedIdsForMeal(selectedFoodsState, meal, { skip });
    return used.has(Number(idFood));
}
