// Controller handlers for archived menus.
import { asyncHandler } from '../middlewares/asyncHandler.js';
import * as service from '../services/archivedMenusService.js';

// Returns the data used by menus.
export const getMenus = asyncHandler(async (req, res) => {
    const rows = await service.getMenus();
    res.json({ data: rows });
});

// Returns the data used by archived menu by id.
export const getArchivedMenuByID = asyncHandler(async (req, res) => {
    const menu = await service.getArchivedMenuByID(req.params.id_arch_menu);
    res.json(menu);
});

// Returns the data used by archived menu meals status.
export const getArchivedMenuMealsStatus = asyncHandler(async (req, res) => {
    const rows = await service.getArchivedMenuMealsStatus(
        req.params.id_arch_menu,
    );
    res.json({ data: rows });
});

// Returns the data used by archived menu fixed dishes.
export const getArchivedMenuFixedDishes = asyncHandler(async (req, res) => {
    const out = await service.getArchivedMenuFixedDishes(
        req.params.id_arch_menu,
    );
    res.json(out);
});

// Returns the data used by archived menu fixed cheeses rotation.
export const getArchivedMenuFixedCheesesRotation = asyncHandler(
    async (req, res) => {
        const out = await service.getArchivedMenuFixedCheesesRotation(
            req.params.id_arch_menu,
        );
        res.json(out);
    },
);

// Returns the data used by archived menu meal composition.
export const getArchivedMenuMealComposition = asyncHandler(async (req, res) => {
    const out = await service.getArchivedMenuMealComposition({
        id_arch_menu_param: req.params.id_arch_menu,
        day_index_param: req.params.day_index,
        meal_type_param: req.params.meal_type,
    });
    res.json(out);
});