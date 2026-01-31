import { Router } from 'express';
import {
    getMenus,
    checkMenuName,
    checkMenuDatesOverlap,
    getMenuBySeasonType,
    createMenu,
    updateMenu,
    deleteMenu,
    getMenuMealsStatus,
    getMenuMealComposition,
    upsertMenuMealComposition,
    getMenuFixedDishes,
    upsertMenuFixedDishes,
} from '../controllers/menusController.js';

const router = Router();

router.get('/', getMenus);
router.get('/exists', checkMenuName);
router.get('/dates-overlap', checkMenuDatesOverlap);
router.get('/:season_type/meals-status', getMenuMealsStatus);
router.get('/:season_type/meals/:day_index/:meal_type', getMenuMealComposition);
router.get('/:season_type/fixed-dishes', getMenuFixedDishes);
router.get('/:season_type', getMenuBySeasonType);

router.post('/', createMenu);
router.put('/:season_type/fixed-dishes', upsertMenuFixedDishes);
router.put('/:season_type', updateMenu);
router.put(
    '/:season_type/meals/:day_index/:meal_type',
    upsertMenuMealComposition,
);
router.delete('/:season_type', deleteMenu);

export default router;
