// backend/routes/reports.js
import { Router } from 'express';
import {
    getConsumiMenus,
    getConsumiReport,
} from '../controllers/reportsController.js';

const router = Router();

router.get('/consumi/menus', getConsumiMenus);
router.get('/consumi', getConsumiReport);

export default router;
