import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
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
    '/:id/disable/app',
    requireAuth,
    requireRole('super_user'),
    disableUserApp,
);

router.post(
    '/:id/update-info/gestionale',
    requireAuth,
    requireRole('super_user'),
    updateUserInfoGestionale,
);

router.post(
    '/:id/update-info/app',
    requireAuth,
    requireRole('super_user'),
    updateUserInfoApp,
);

router.post(
    '/:id/delete/gestionale',
    requireAuth,
    requireRole('super_user'),
    deleteUserGestionale,
);
router.post(
    '/:id/delete/app',
    requireAuth,
    requireRole('super_user'),
    deleteUserApp,
);

export default router;
