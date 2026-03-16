// Express routes for archived menus.
import { Router } from 'express';
import {
    getMenus,
    getArchivedMenuByID,
    getArchivedMenuMealsStatus,
    getArchivedMenuFixedDishes,
    getArchivedMenuFixedCheesesRotation,
    getArchivedMenuMealComposition,
} from '../controllers/archivedMenusController.js';

// Route definitions
const router = Router();

router.get('/', getMenus);
router.get('/view/:id_arch_menu', getArchivedMenuByID);
router.get('/:id_arch_menu/meals-status', getArchivedMenuMealsStatus);
router.get(
    '/:id_arch_menu/meals/:day_index/:meal_type',
    getArchivedMenuMealComposition,
);
router.get('/:id_arch_menu/fixed-dishes', getArchivedMenuFixedDishes);
router.get(
    '/:id_arch_menu/fixed-cheeses-rotation',
    getArchivedMenuFixedCheesesRotation,
);

export default router;