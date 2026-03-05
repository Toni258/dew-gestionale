import { asyncHandler } from '../middlewares/asyncHandler.js';
import * as service from '../services/archivedMenusService.js';

export const getMenus = asyncHandler(async (req, res) => {
    const rows = await service.getMenus();
    res.json({ data: rows });
});

export const getArchivedMenuByID = asyncHandler(async (req, res) => {
    const menu = await service.getArchivedMenuByID(req.params.id_arch_menu);
    res.json(menu);
});

export const getArchivedMenuMealsStatus = asyncHandler(async (req, res) => {
    const rows = await service.getArchivedMenuMealsStatus(
        req.params.id_arch_menu,
    );
    res.json({ data: rows });
});

export const getArchivedMenuFixedDishes = asyncHandler(async (req, res) => {
    const out = await service.getArchivedMenuFixedDishes(
        req.params.id_arch_menu,
    );
    res.json(out);
});

export const getArchivedMenuFixedCheesesRotation = asyncHandler(
    async (req, res) => {
        const out = await service.getArchivedMenuFixedCheesesRotation(
            req.params.id_arch_menu,
        );
        res.json(out);
    },
);

// DA CAPIRE SE SERVONO ANCHE QUESTE CHIAMATE
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------

export const checkMenuName = asyncHandler(async (req, res) => {
    const out = await service.checkMenuName({
        name: req.query.name,
        excludeName: req.query.excludeName,
    });
    res.json(out);
});

export const checkMenuDatesOverlap = asyncHandler(async (req, res) => {
    const out = await service.checkMenuDatesOverlap({
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        excludeName: req.query.excludeName,
    });
    res.json(out);
});

export const createMenu = asyncHandler(async (req, res) => {
    const out = await service.createMenu(req.body);
    res.status(201).json(out);
});

export const updateMenu = asyncHandler(async (req, res) => {
    const out = await service.updateMenu(req.params.season_type, req.body);
    res.json(out);
});

export const deleteMenu = asyncHandler(async (req, res) => {
    const out = await service.deleteMenu(req.params.season_type);
    res.json(out);
});

export const getMenuMealComposition = asyncHandler(async (req, res) => {
    const out = await service.getMenuMealComposition({
        season_type_param: req.params.season_type,
        day_index_param: req.params.day_index,
        meal_type_param: req.params.meal_type,
    });
    res.json(out);
});

export const upsertMenuMealComposition = asyncHandler(async (req, res) => {
    const out = await service.upsertMenuMealComposition({
        season_type_param: req.params.season_type,
        day_index_param: req.params.day_index,
        meal_type_param: req.params.meal_type,
        body: req.body,
    });
    res.json(out);
});

/* ===== PIATTI FISSI + FORMAGGI ===== */

export const upsertMenuFixedDishes = asyncHandler(async (req, res) => {
    const out = await service.upsertMenuFixedDishes(
        req.params.season_type,
        req.body,
    );
    res.json(out);
});
