import { Router } from 'express';
import { requireRole } from '../middlewares/auth.js';
import {
    getFilteredUsersMobileApp,
    getFilteredUsersGestionale,
    resetPasswordAdmin,
    suspendUser,
    unsuspendUser,
    deleteUserGestionale,
    updateUserInfoGestionale,
    updateUserInfoApp,
    deleteUserApp,
    disableUserApp,
    checkEmail,
    createUserGestionale,
} from '../controllers/usersController.js';

const router = Router();

// Liste: basta essere autenticati
router.get('/mobile', getFilteredUsersMobileApp);
router.get('/gestionale', getFilteredUsersGestionale);

// Azioni: SOLO super_user
router.get('/emailExists', requireRole('super_user'), checkEmail);
router.post('/create/gestionale', requireRole('super_user'), createUserGestionale);
router.post('/:id/reset-password', requireRole('super_user'), resetPasswordAdmin);
router.post('/:id/suspend', requireRole('super_user'), suspendUser);
router.post('/:id/unsuspend', requireRole('super_user'), unsuspendUser);
router.post('/:id/disable/app', requireRole('super_user'), disableUserApp);
router.post('/:id/update-info/gestionale', requireRole('super_user'), updateUserInfoGestionale);
router.post('/:id/update-info/app', requireRole('super_user'), updateUserInfoApp);
router.post('/:id/delete/gestionale', requireRole('super_user'), deleteUserGestionale);
router.post('/:id/delete/app', requireRole('super_user'), deleteUserApp);

export default router;
