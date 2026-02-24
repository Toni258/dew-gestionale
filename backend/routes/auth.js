import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
    login,
    logout,
    me,
    changePassword,
} from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/change-password', requireAuth, changePassword);
router.get('/me', requireAuth, me);

export default router;
