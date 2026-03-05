import { Router } from 'express';
import {
    getMenus,
    getArchivedMenuByID,
    getArchivedMenuMealsStatus,
    getArchivedMenuFixedDishes,
    getArchivedMenuFixedCheesesRotation,
    // --------
    // --------
    // --------
    // --------
    // --------
    // --------
    checkMenuName,
    checkMenuDatesOverlap,
    createMenu,
    updateMenu,
    deleteMenu,
    getMenuMealComposition,
    upsertMenuMealComposition,
    upsertMenuFixedDishes,
} from '../controllers/archivedMenusController.js';

const router = Router();

router.get('/', getMenus);
router.get('/view/:id_arch_menu', getArchivedMenuByID);
router.get('/:id_arch_menu/meals-status', getArchivedMenuMealsStatus);
router.get('/:id_arch_menu/fixed-dishes', getArchivedMenuFixedDishes);
router.get(
    '/:id_arch_menu/fixed-cheeses-rotation',
    getArchivedMenuFixedCheesesRotation,
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

router.get('/exists', checkMenuName);
router.get('/dates-overlap', checkMenuDatesOverlap);
router.get('/:season_type/meals/:day_index/:meal_type', getMenuMealComposition);

router.post('/', createMenu);
router.put('/:season_type/fixed-dishes', upsertMenuFixedDishes);
router.put('/:season_type', updateMenu);
router.put(
    '/:season_type/meals/:day_index/:meal_type',
    upsertMenuMealComposition,
);
router.delete('/:season_type', deleteMenu);

export default router;
