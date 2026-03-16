// Controller handlers for dishes.
import {
    checkDishNameAvailability,
    createDishData,
    deleteDishData,
    getDishByIdData,
    getFilteredDishesData,
    updateDishData,
} from '../services/dishesService.js';
import {
    applyDishSuspension,
    disableDishSuspensionByDishId,
    previewDishSuspension,
} from '../services/dishSuspensionsService.js';

// Sends known service errors back to the client.
function handleServiceError(res, next, error) {
    if (error?.status) {
        return res.status(error.status).json({
            error: error.message,
            ...(error?.details ? { details: error.details } : {}),
        });
    }

    return next(error);
}

// Returns the data used by filtered dishes.
export async function getFilteredDishes(req, res, next) {
    try {
        const result = await getFilteredDishesData(req.query || {});
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Checks the current value for dish name.
export async function checkDishName(req, res, next) {
    try {
        const result = await checkDishNameAvailability(req.query || {});
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Creates the data for dish.
export async function createDish(req, res, next) {
    try {
        const result = await createDishData(req.body || {}, req.file || null);
        return res.status(201).json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Deletes the data for dish.
export async function deleteDish(req, res, next) {
    try {
        const result = await deleteDishData(req.params.id);
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Returns the data used by dish by id.
export async function getDishById(req, res, next) {
    try {
        const result = await getDishByIdData(req.params.id);
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Updates the data for dish.
export async function updateDish(req, res, next) {
    try {
        const result = await updateDishData(
            req.params.id,
            req.body || {},
            req.file || null,
        );
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Helper function used by suspend dish.
export async function suspendDish(req, res, next) {
    try {
        const mode = req.body?.mode === 'dry-run' ? 'dry-run' : 'apply';
        const result =
            mode === 'dry-run'
                ? await previewDishSuspension(req.params.id, req.body || {})
                : await applyDishSuspension(req.params.id, req.body || {});

        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Disables the data used by dish suspension.
export async function disableDishSuspension(req, res, next) {
    try {
        const result = await disableDishSuspensionByDishId(req.params.id);
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}