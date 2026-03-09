// backend/routes/reports.js
import { Router } from 'express';
import {
    getConsumiMenus,
    getConsumiReport,
    getScelteMenus,
    getScelteReport,
} from '../controllers/reportsController.js';

const router = Router();

router.get('/consumi/menus', getConsumiMenus);
router.get('/consumi', getConsumiReport);

router.get('/scelte/menus', getScelteMenus);
router.get('/scelte', getScelteReport);

export default router;
