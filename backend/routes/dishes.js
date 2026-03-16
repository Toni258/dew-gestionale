// Express routes for dishes.
import { Router } from 'express';
import {
    getFilteredDishes,
    checkDishName,
    createDish,
    deleteDish,
    getDishById,
    updateDish,
    suspendDish,
    disableDishSuspension,
} from '../controllers/dishesController.js';
import { uploadFoodImage } from '../middlewares/uploadFoodImage.js';

// Route definitions
const router = Router();

router.get('/', getFilteredDishes);
router.get('/exists', checkDishName);

router.post('/:id/suspend', suspendDish);
router.post('/:id/unsuspend', disableDishSuspension);

router.get('/:id', getDishById);
router.post('/', uploadFoodImage.single('img'), createDish);
router.put('/:id', uploadFoodImage.single('img'), updateDish);
router.delete('/:id', deleteDish);

export default router;