// Controller handlers for foods.
import {
    getCheeseFoodsData,
    getFoodsAvailableForMenuData,
    getFoodsByType,
} from '../services/foodsService.js';

// Sends known service errors back to the client.
function handleServiceError(res, next, error) {
    if (error?.status) {
        return res.status(error.status).json({ error: error.message });
    }

    return next(error);
}

// Returns the data used by foods.
export async function getFoods(req, res, next) {
    try {
        const result = await getFoodsByType(req.query || {});
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Returns the data used by foods available for menu.
export async function getFoodsAvailableForMenu(req, res, next) {
    try {
        const result = await getFoodsAvailableForMenuData(req.query || {});
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

// Returns the data used by cheese foods.
export async function getCheeseFoods(req, res, next) {
    try {
        const result = await getCheeseFoodsData();
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}