/**
 * Small helpers for the dish suspension flow.
 * They are shared between the page, the sticky save bar and the suspension hook.
 */
export function hasDishSuspensionChanged(initialSuspension, currentValues) {
    const enabledNow = !!currentValues?.suspension_enabled;
    const enabledBefore = !!initialSuspension?.enabled;

    if (enabledNow !== enabledBefore) return true;
    if (!enabledNow) return false;

    return (
        (currentValues?.start_date ?? '') !==
            (initialSuspension?.valid_from ?? '') ||
        (currentValues?.end_date ?? '') !==
            (initialSuspension?.valid_to ?? '') ||
        (currentValues?.reason ?? '') !== (initialSuspension?.reason ?? '')
    );
}

export function buildDishSuspensionMenuKey(conflict) {
    return `${conflict.season_type}__${conflict.meal_type}__${conflict.course_type}`;
}

export function groupDishConflictsBySeason(conflicts = []) {
    const map = new Map();

    for (const conflict of conflicts) {
        if (!map.has(conflict.season_type)) {
            map.set(conflict.season_type, {
                season_type: conflict.season_type,
                is_active_menu: false,
                total_occurrences: 0,
                fixed_occurrences: 0,
                items: [],
            });
        }

        const group = map.get(conflict.season_type);
        group.total_occurrences += 1;

        if (conflict.first_choice === 1) {
            group.fixed_occurrences += 1;
        }

        if (conflict.is_menu_active_today === 1) {
            group.is_active_menu = true;
        }

        group.items.push(conflict);
    }

    return Array.from(map.values());
}

export function buildDishSuspensionReplacementsPayload(replacementByPairing) {
    return Object.entries(replacementByPairing).map(
        ([id_dish_pairing, id_food_new]) => ({
            id_dish_pairing: Number(id_dish_pairing),
            id_food_new: id_food_new ? Number(id_food_new) : null,
        }),
    );
}
