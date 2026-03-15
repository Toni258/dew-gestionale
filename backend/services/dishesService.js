/**
 * Service layer for dish CRUD operations.
 * It validates payloads, coordinates repository calls and handles uploaded images.
 */
import { pool } from '../db/db.js';
import { withTransaction } from '../db/tx.js';
import { HttpError } from '../utils/httpError.js';
import {
    cleanupUploadedFoodImage,
    deleteFoodImageFile,
} from './fileStorageService.js';
import { COURSE_TYPES } from '../../shared/constants.js';
import {
    checkDishNameExists,
    countFilteredDishes,
    deleteDish,
    findCurrentOrFutureSuspensionByFoodId,
    findDishSummaryById,
    insertDish,
    listFilteredDishes,
    updateDish,
} from '../repositories/dishesRepo.js';

function normalizeAllergyNotes(allergyNotes) {
    if (!Array.isArray(allergyNotes)) return null;

    const cleaned = allergyNotes
        .map((entry) => String(entry ?? '').trim())
        .filter(Boolean);

    return cleaned.length ? cleaned.join(', ') : null;
}

function toNumericDishId(dishId) {
    const numericDishId = Number(dishId);
    if (!Number.isInteger(numericDishId) || numericDishId <= 0) {
        throw new HttpError(400, 'id non valido');
    }

    return numericDishId;
}

function normalizeDishName(name) {
    const normalized = String(name ?? '').trim();
    if (!normalized || normalized.length < 3) {
        throw new HttpError(400, 'Nome piatto non valido');
    }
    return normalized;
}

function normalizeDishType(type) {
    const normalized = String(type ?? '').trim();
    if (!COURSE_TYPES.includes(normalized)) {
        throw new HttpError(400, 'Tipo piatto non valido');
    }
    return normalized;
}

function normalizeNonNegativeNumber(value, label) {
    if (value === '' || value === null || value === undefined) {
        throw new HttpError(400, `${label} obbligatorio`);
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) {
        throw new HttpError(400, `${label} non valido`);
    }

    return numericValue;
}

function normalizeDishPayload(body = {}) {
    return {
        name: normalizeDishName(body.name),
        type: normalizeDishType(body.type),
        grammage_tot: normalizeNonNegativeNumber(
            body.grammage_tot,
            'Grammatura totale',
        ),
        kcal_tot: normalizeNonNegativeNumber(body.kcal_tot, 'Kcal totali'),
        proteins: normalizeNonNegativeNumber(body.proteins, 'Proteine'),
        carbohydrates: normalizeNonNegativeNumber(
            body.carbohydrates,
            'Carboidrati',
        ),
        fats: normalizeNonNegativeNumber(body.fats, 'Grassi'),
        allergy_notes: normalizeAllergyNotes(body.allergy_notes),
    };
}

export async function getFilteredDishesData(query = {}) {
    const search = String(query.search ?? '').trim();
    const status = String(query.stato ?? '').trim();
    const type = String(query.tipologia ?? '').trim();
    let allergens = query.allergeni ?? [];

    if (!Array.isArray(allergens)) {
        allergens = [allergens];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 30));

    const [rows, total] = await Promise.all([
        listFilteredDishes(pool, {
            search,
            status,
            type,
            allergens: allergens.filter(Boolean),
            page,
            pageSize,
        }),
        countFilteredDishes(pool, {
            search,
            status,
            type,
            allergens: allergens.filter(Boolean),
        }),
    ]);

    return {
        data: rows,
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
}

export async function checkDishNameAvailability({ name, excludeId } = {}) {
    const cleanName = String(name ?? '').trim();
    if (!cleanName) return { exists: false };

    const normalizedName = cleanName.replace(/\s+/g, ' ').toLowerCase();
    const exists = await checkDishNameExists(pool, normalizedName, {
        excludeId: excludeId ? Number(excludeId) : undefined,
    });

    return { exists };
}

export async function createDishData(body = {}, file = null) {
    const payload = normalizeDishPayload(body);

    if (!file?.filename) {
        throw new HttpError(400, 'Immagine piatto obbligatoria');
    }

    try {
        await insertDish(pool, {
            ...payload,
            image_url: file.filename,
        });

        return { success: true };
    } catch (error) {
        await cleanupUploadedFoodImage(file);

        if (error?.code === 'ER_DUP_ENTRY') {
            throw new HttpError(409, 'Nome piatto già esistente');
        }

        throw error;
    }
}

export async function deleteDishData(dishIdRaw) {
    const dishId = toNumericDishId(dishIdRaw);
    const dish = await findDishSummaryById(pool, dishId);

    if (!dish) {
        throw new HttpError(404, 'Piatto non trovato per immagine');
    }

    try {
        const affected = await deleteDish(pool, dishId);
        if (!affected) {
            throw new HttpError(404, 'Piatto non trovato per delete');
        }

        await deleteFoodImageFile(dish.image_url);
        return { success: true };
    } catch (error) {
        if (error?.status) {
            throw error;
        }

        if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
            throw new HttpError(
                409,
                'Impossibile eliminare: il piatto è usato altrove.',
            );
        }

        throw error;
    }
}

export async function getDishByIdData(dishIdRaw) {
    const dishId = toNumericDishId(dishIdRaw);
    const dish = await findDishSummaryById(pool, dishId);

    if (!dish) {
        throw new HttpError(404, 'Piatto non trovato');
    }

    const suspension = await findCurrentOrFutureSuspensionByFoodId(pool, dishId);

    return {
        ...dish,
        allergy_notes: dish.allergy_notes
            ? dish.allergy_notes.split(',').map((entry) => entry.trim())
            : [],
        suspension: suspension
            ? {
                  id_avail: suspension.id_avail,
                  valid_from: suspension.valid_from,
                  valid_to: suspension.valid_to,
                  reason: suspension.reason,
              }
            : null,
    };
}

export async function updateDishData(dishIdRaw, body = {}, file = null) {
    const dishId = toNumericDishId(dishIdRaw);
    const payload = normalizeDishPayload(body);
    const newImageFilename = file?.filename ?? null;
    let oldImageFilename = null;

    try {
        await withTransaction(async (conn) => {
            const currentDish = await findDishSummaryById(conn, dishId);
            if (!currentDish) {
                throw new HttpError(404, 'Piatto non trovato');
            }

            oldImageFilename = currentDish.image_url;

            const affected = await updateDish(conn, dishId, {
                ...payload,
                image_url: newImageFilename ?? oldImageFilename,
            });

            if (!affected) {
                throw new HttpError(404, 'Piatto non trovato');
            }
        });

        // Delete the old image only after the transaction is safely committed.
        if (
            newImageFilename &&
            oldImageFilename &&
            newImageFilename !== oldImageFilename
        ) {
            await deleteFoodImageFile(oldImageFilename);
        }

        return { success: true };
    } catch (error) {
        await cleanupUploadedFoodImage(file);

        if (error?.code === 'ER_DUP_ENTRY') {
            throw new HttpError(409, 'Nome piatto già esistente');
        }

        throw error;
    }
}
