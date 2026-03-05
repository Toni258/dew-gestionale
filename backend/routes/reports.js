// backend/routes/reports.js
import { Router } from 'express';
import {
    getConsumiReport,
    getConsumiReportArchive,
} from '../controllers/reportsController.js';

const router = Router();

router.get('/consumi', getConsumiReport);
router.get('/consumi-archivio', getConsumiReportArchive);

export default router;
