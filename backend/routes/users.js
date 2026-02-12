import { Router } from 'express';
import { getFilteredUsers } from '../controllers/usersController.js';

const router = Router();

router.get('/', getFilteredUsers);

//router.post('/:id/unsuspend', disableDishSuspension);

//router.put('/:id', uploadFoodImage.single('img'), updateDish);

//router.delete('/:id', deleteDish);

export default router;
