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

export const getArchivedMenuMealComposition = asyncHandler(async (req, res) => {
    const out = await service.getArchivedMenuMealComposition({
        id_arch_menu_param: req.params.id_arch_menu,
        day_index_param: req.params.day_index,
        meal_type_param: req.params.meal_type,
    });
    res.json(out);
});
