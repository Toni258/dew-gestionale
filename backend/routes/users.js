import { Router } from 'express';
import { getFilteredUsersMobileApp } from '../controllers/usersController.js';
import { getFilteredUsersGestionale } from '../controllers/usersController.js';

const router = Router();

router.get('/mobile', getFilteredUsersMobileApp);
router.get('/gestionale', getFilteredUsersGestionale);

//router.post('/:id/unsuspend', disableDishSuspension);

//router.put('/:id', uploadFoodImage.single('img'), updateDish);

//router.delete('/:id', deleteDish);

export default router;
