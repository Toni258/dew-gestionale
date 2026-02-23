import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { login, logout, me } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
