import {
    getCheeseFoodsData,
    getFoodsAvailableForMenuData,
    getFoodsByType,
} from '../services/foodsService.js';

function handleServiceError(res, next, error) {
    if (error?.status) {
        return res.status(error.status).json({ error: error.message });
    }

    return next(error);
}

export async function getFoods(req, res, next) {
    try {
        const result = await getFoodsByType(req.query || {});
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

export async function getFoodsAvailableForMenu(req, res, next) {
    try {
        const result = await getFoodsAvailableForMenuData(req.query || {});
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}

export async function getCheeseFoods(req, res, next) {
    try {
        const result = await getCheeseFoodsData();
        return res.json(result);
    } catch (error) {
        return handleServiceError(res, next, error);
    }
}
