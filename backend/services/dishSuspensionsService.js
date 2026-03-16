// Service layer used for dish suspensions.
import { withTransaction } from '../db/tx.js';
import { pool } from '../db/db.js';
import { HttpError } from '../utils/httpError.js';
import {
    closeFoodAvailability,
    disableDishPairingsByIds,
    disableTrackedReplacementPairingsByAvailability,
    findActiveDuplicatePairing,
    findCurrentOrFutureSuspensionByFoodId,
    findDishSummaryById,
    findFoodType,
    findPairingInfo,
    insertDishPairing,
    insertTrackedReplacementRow,
    isFoodFixedInMenu,
    isFoodSuspendedInRange,
    listDishConflictsForPeriod,
    restoreOriginalDishPairingsByRange,
    upsertFoodAvailability,
} from '../repositories/dishesRepo.js';

// Converts the input into numeric dish id.
function toNumericDishId(dishId) {
    const numericDishId = Number(dishId);
    if (!Number.isInteger(numericDishId) || numericDishId <= 0) {
        throw new HttpError(400, 'id non valido');
    }

    return numericDishId;
}

// Normalizes the value used by reason.
function normalizeReason(reason) {
    const normalized = String(reason ?? '').trim();
    return normalized || null;
}

// Parses the value used by replacement map.
function parseReplacementMap(replacements = []) {
    return new Map(
        (Array.isArray(replacements) ? replacements : [])
            .filter((item) => Number.isFinite(Number(item?.id_dish_pairing)))
            .map((item) => [
                Number(item.id_dish_pairing),
                item.id_food_new == null || item.id_food_new === ''
                    ? null
                    : Number(item.id_food_new),
            ]),
    );
}

// Helper function used by summarize conflicts.
function summarizeConflicts(conflicts) {
    return {
        conflicts_total: conflicts.length,
        conflicts_in_active_menu: conflicts.filter(
            (conflict) => Number(conflict.is_menu_active_today) === 1,
        ).length,
    };
}

// Returns the data used by dish or throw.
async function getDishOrThrow(poolOrConn, dishId) {
    const dish = await findDishSummaryById(poolOrConn, dishId);
    if (!dish) {
        throw new HttpError(404, 'Piatto non trovato');
    }

    return dish;
}

// Validates the data used by suspension payload.
function validateSuspensionPayload({ valid_from, valid_to, mode, action }) {
    if (!valid_from || !valid_to) {
        throw new HttpError(400, 'Parametri obbligatori: valid_from, valid_to');
    }

    if (valid_to < valid_from) {
        throw new HttpError(400, 'valid_to deve essere >= valid_from');
    }

    if (mode && !['dry-run', 'apply'].includes(mode)) {
        throw new HttpError(400, 'mode non valido (usa dry-run o apply)');
    }

    if (action && !['disable-only', 'replace'].includes(action)) {
        throw new HttpError(400, 'action non valida (usa disable-only o replace)');
    }
}

// Helper function used by preview dish suspension.
export async function previewDishSuspension(dishIdRaw, payload = {}) {
    const dishId = toNumericDishId(dishIdRaw);
    validateSuspensionPayload({ ...payload, mode: 'dry-run' });

    const dish = await getDishOrThrow(pool, dishId);
    const conflicts = await listDishConflictsForPeriod(pool, {
        dishId,
        validFrom: payload.valid_from,
        validTo: payload.valid_to,
    });

    const summary = summarizeConflicts(conflicts);

    return {
        ok: true,
        mode: 'dry-run',
        dish: { id_food: dish.id_food, name: dish.name },
        suspension: {
            valid_from: payload.valid_from,
            valid_to: payload.valid_to,
            reason: normalizeReason(payload.reason),
        },
        conflicts,
        summary,
        message:
            conflicts.length > 0
                ? 'La sospensione impatta alcuni menu. Conferma per applicare (disabilitazione occorrenze) e, se vuoi, sostituire.'
                : 'Nessuna interferenza: puoi applicare la sospensione.',
    };
}

// Helper function used by reset existing suspension state.
async function resetExistingSuspensionState(conn, { dishId, existingSuspension }) {
    if (!existingSuspension) {
        return {
            restoredOriginalPairings: 0,
            disabledTrackedReplacements: 0,
        };
    }

    const restoredOriginalPairings = await restoreOriginalDishPairingsByRange(conn, {
        dishId,
        validFrom: existingSuspension.valid_from,
        validTo: existingSuspension.valid_to,
    });

    const disabledTrackedReplacements = await disableTrackedReplacementPairingsByAvailability(
        conn,
        existingSuspension.id_avail,
    );

    return {
        restoredOriginalPairings,
        disabledTrackedReplacements,
    };
}

// Applies the changes used by dish suspension.
export async function applyDishSuspension(dishIdRaw, payload = {}) {
    const dishId = toNumericDishId(dishIdRaw);
    const {
        valid_from,
        valid_to,
        reason = '',
        action = 'disable-only',
        replacements = [],
    } = payload;

    validateSuspensionPayload({ valid_from, valid_to, mode: 'apply', action });

    return withTransaction(async (conn) => {
        const dish = await getDishOrThrow(conn, dishId);
        const existingSuspension = await findCurrentOrFutureSuspensionByFoodId(
            conn,
            dishId,
        );

        await resetExistingSuspensionState(conn, {
            dishId,
            existingSuspension,
        });

        const idAvail = await upsertFoodAvailability(conn, {
            existingIdAvail: existingSuspension?.id_avail,
            dishId,
            validFrom: valid_from,
            validTo: valid_to,
            reason: normalizeReason(reason),
        });

        const conflicts = await listDishConflictsForPeriod(conn, {
            dishId,
            validFrom: valid_from,
            validTo: valid_to,
        });

        const conflictIds = conflicts
            .map((conflict) => Number(conflict.id_dish_pairing))
            .filter(Number.isFinite);
        const repMap = parseReplacementMap(replacements);

        if (action === 'replace') {
            const missing = conflictIds.filter((id) => !repMap.get(id));
            if (missing.length) {
                throw new HttpError(
                    400,
                    'Per "Salva e sostituisci" devi selezionare un piatto per ogni occorrenza.',
                );
            }
        }

        if (action === 'disable-only') {
            const hasAnyReplacement = conflictIds.some((id) => !!repMap.get(id));
            if (hasAnyReplacement) {
                throw new HttpError(
                    400,
                    'Per "Salva sospensione (non sostituire)" le sostituzioni devono essere vuote.',
                );
            }
        }

        const disabledPairings = await disableDishPairingsByIds(conn, {
            dishId,
            pairingIds: conflictIds,
        });

        if (action !== 'replace') {
            return {
                ok: true,
                mode: 'apply',
                action,
                dish: { id_food: dish.id_food, name: dish.name },
                suspension: {
                    valid_from,
                    valid_to,
                    reason: normalizeReason(reason),
                },
                disabled_pairings: disabledPairings,
                inserted_pairings: 0,
                skipped_duplicates: 0,
                conflicts_preview: conflicts,
                summary: summarizeConflicts(conflicts),
                message:
                    'Sospensione applicata: occorrenze disabilitate (menù da completare manualmente).',
            };
        }

        let insertedPairings = 0;
        let skippedDuplicates = 0;

        for (const conflictId of conflictIds) {
            const newFoodId = repMap.get(conflictId);
            if (!newFoodId) {
                continue;
            }

            if (newFoodId === dishId) {
                throw new HttpError(400, 'Sostituzione non valida: stesso piatto.');
            }

            const pairingInfo = await findPairingInfo(conn, {
                pairingId: conflictId,
                dishId,
            });
            if (!pairingInfo) {
                throw new HttpError(400, `Occorrenza ${conflictId} non valida.`);
            }

            const replacementDish = await findFoodType(conn, newFoodId);
            if (!replacementDish) {
                throw new HttpError(
                    400,
                    `Piatto sostitutivo ${newFoodId} non trovato.`,
                );
            }

            if (replacementDish.type !== pairingInfo.old_type) {
                throw new HttpError(
                    400,
                    `Tipo non compatibile per occorrenza ${conflictId}: serve ${pairingInfo.old_type}, hai scelto ${replacementDish.type}.`,
                );
            }

            const suspendedInRange = await isFoodSuspendedInRange(conn, {
                dishId: newFoodId,
                validFrom: valid_from,
                validTo: valid_to,
            });
            if (suspendedInRange) {
                throw new HttpError(
                    400,
                    `Il piatto selezionato (${newFoodId}) è sospeso nel periodo scelto.`,
                );
            }

            const fixedInMenu = await isFoodFixedInMenu(conn, {
                dishId: newFoodId,
                seasonType: pairingInfo.season_type,
                mealType: pairingInfo.meal_type,
            });
            if (fixedInMenu) {
                throw new HttpError(
                    400,
                    `Il piatto selezionato (${newFoodId}) è un piatto fisso nel menù "${pairingInfo.season_type}" (${pairingInfo.meal_type}).`,
                );
            }

            const duplicate = await findActiveDuplicatePairing(conn, {
                seasonType: pairingInfo.season_type,
                idMeal: pairingInfo.id_meal,
                dishId: newFoodId,
            });
            if (duplicate) {
                skippedDuplicates += 1;
                continue;
            }

            const replacementPairingId = await insertDishPairing(conn, {
                idMeal: pairingInfo.id_meal,
                dishId: newFoodId,
                seasonType: pairingInfo.season_type,
                used: 1,
            });

            await insertTrackedReplacementRow(conn, {
                idAvail,
                originalIdDishPairing: conflictId,
                replacementIdDishPairing: replacementPairingId,
                originalIdFood: dishId,
                replacementIdFood: newFoodId,
                seasonType: pairingInfo.season_type,
                idMeal: pairingInfo.id_meal,
            });

            insertedPairings += 1;
        }

        return {
            ok: true,
            mode: 'apply',
            action,
            dish: { id_food: dish.id_food, name: dish.name },
            suspension: {
                valid_from,
                valid_to,
                reason: normalizeReason(reason),
            },
            disabled_pairings: disabledPairings,
            inserted_pairings: insertedPairings,
            skipped_duplicates: skippedDuplicates,
            conflicts_preview: conflicts,
            summary: summarizeConflicts(conflicts),
            message:
                'Sospensione applicata: occorrenze disabilitate e sostituzioni inserite dove selezionate.',
        };
    });
}

// Disables the data used by dish suspension by dish id.
export async function disableDishSuspensionByDishId(dishIdRaw) {
    const dishId = toNumericDishId(dishIdRaw);

    return withTransaction(async (conn) => {
        const suspension = await findCurrentOrFutureSuspensionByFoodId(conn, dishId);
        if (!suspension) {
            throw new HttpError(
                404,
                'Nessuna sospensione attiva o futura trovata per questo piatto',
            );
        }

        const originalDish = await getDishOrThrow(conn, dishId);
        const restoredOriginals = await restoreOriginalDishPairingsByRange(conn, {
            dishId,
            validFrom: suspension.valid_from,
            validTo: suspension.valid_to,
        });
        const disabledReplacements = await disableTrackedReplacementPairingsByAvailability(
            conn,
            suspension.id_avail,
        );
        const closedRecords = await closeFoodAvailability(conn, suspension.id_avail);

        return {
            ok: true,
            dish: { id_food: originalDish.id_food, name: originalDish.name },
            closed_records: closedRecords,
            restored_original_pairings: restoredOriginals,
            disabled_replacement_pairings: disabledReplacements,
            message: 'Sospensione disattivata e stato precedente ripristinato',
        };
    });
}