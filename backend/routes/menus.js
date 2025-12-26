import { Router } from 'express';
import {
    getMenus,
    checkMenuName,
    checkMenuDatesOverlap,
    getMenuBySeasonType,
    createMenu,
    updateMenu,
    deleteMenu,
} from '../controllers/menusController.js';

const router = Router();

router.get('/', getMenus);
router.get('/exists', checkMenuName);
router.get('/dates-overlap', checkMenuDatesOverlap);
router.get('/:season_type', getMenuBySeasonType);

router.post('/', createMenu);
router.put('/:season_type', updateMenu);
router.delete('/:season_type', deleteMenu);

export default router;
