// Controller handlers for menus.
import { asyncHandler } from '../middlewares/asyncHandler.js';
import * as service from '../services/menusService.js';

// Returns the data used by menus.
export const getMenus = asyncHandler(async (req, res) => {
    const rows = await service.getMenus();
    res.json({ data: rows });
});

// Checks the current value for menu name.
export const checkMenuName = asyncHandler(async (req, res) => {
    const out = await service.checkMenuName({
        name: req.query.name,
        excludeName: req.query.excludeName,
    });
    res.json(out);
});

// Checks the current value for menu dates overlap.
export const checkMenuDatesOverlap = asyncHandler(async (req, res) => {
    const out = await service.checkMenuDatesOverlap({
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        excludeName: req.query.excludeName,
        excludeArchMenuId: req.query.excludeArchMenuId,
    });
    res.json(out);
});

// Returns the data used by menu by season type.
export const getMenuBySeasonType = asyncHandler(async (req, res) => {
    const menu = await service.getMenuBySeasonType(req.params.season_type);
    res.json(menu);
});

// Returns the data used by menu meals status.
export const getMenuMealsStatus = asyncHandler(async (req, res) => {
    const rows = await service.getMenuMealsStatus(req.params.season_type);
    res.json({ data: rows });
});

// Creates the data for menu.
export const createMenu = asyncHandler(async (req, res) => {
    const out = await service.createMenu(req.body);
    res.status(201).json(out);
});

// Updates the data for menu.
export const updateMenu = asyncHandler(async (req, res) => {
    const out = await service.updateMenu(req.params.season_type, req.body);
    res.json(out);
});

// Deletes the data for menu.
export const deleteMenu = asyncHandler(async (req, res) => {
    const out = await service.deleteMenu(req.params.season_type);
    res.json(out);
});

// Returns the data used by menu meal composition.
export const getMenuMealComposition = asyncHandler(async (req, res) => {
    const out = await service.getMenuMealComposition({
        season_type_param: req.params.season_type,
        day_index_param: req.params.day_index,
        meal_type_param: req.params.meal_type,
    });
    res.json(out);
});

// Helper function used by upsert menu meal composition.
export const upsertMenuMealComposition = asyncHandler(async (req, res) => {
    const out = await service.upsertMenuMealComposition({
        season_type_param: req.params.season_type,
        day_index_param: req.params.day_index,
        meal_type_param: req.params.meal_type,
        body: req.body,
    });
    res.json(out);
});

// ===== PIATTI FISSI + FORMAGGI =====

// Returns the data used by menu fixed dishes.
export const getMenuFixedDishes = asyncHandler(async (req, res) => {
    const out = await service.getMenuFixedDishes(req.params.season_type);
    res.json(out);
});

// Helper function used by upsert menu fixed dishes.
export const upsertMenuFixedDishes = asyncHandler(async (req, res) => {
    const out = await service.upsertMenuFixedDishes(
        req.params.season_type,
        req.body,
    );
    res.json(out);
});

// Returns the data used by menu fixed cheeses rotation.
export const getMenuFixedCheesesRotation = asyncHandler(async (req, res) => {
    const out = await service.getFixedCheesesRotation(req.params.season_type);
    res.json(out);
});

// Helper function used by archive menu.
export const archiveMenu = asyncHandler(async (req, res) => {
    const out = await service.archiveMenu(req.params.season_type);
    res.json(out);
});