import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import {
    getFilteredUsersMobileApp,
    getFilteredUsersGestionale,
    resetPasswordAdmin,
    suspendUser,
    unsuspendUser,
    deleteUser,
    updateUserInfo,
} from '../controllers/usersController.js';

const router = Router();

// Liste: basta essere autenticati
router.get('/mobile', requireAuth, getFilteredUsersMobileApp);
router.get('/gestionale', requireAuth, getFilteredUsersGestionale);

// Azioni: SOLO super_user
router.post(
    '/:id/reset-password',
    requireAuth,
    requireRole('super_user'),
    resetPasswordAdmin,
);

router.post(
    '/:id/suspend',
    requireAuth,
    requireRole('super_user'),
    suspendUser,
);

router.post(
    '/:id/unsuspend',
    requireAuth,
    requireRole('super_user'),
    unsuspendUser,
);

router.post(
    '/:id/update-info',
    requireAuth,
    requireRole('super_user'),
    updateUserInfo,
);

router.post('/:id/delete', requireAuth, requireRole('super_user'), deleteUser);

export default router;
