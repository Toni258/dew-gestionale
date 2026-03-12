import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import {
    login,
    logout,
    me,
    changePassword,
    requestPasswordReset,
} from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/request-password-reset', requestPasswordReset);
router.post('/change-password', requireAuth, changePassword);
router.get('/me', requireAuth, me);

export default router;
