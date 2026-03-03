// backend/routes/reports.js
import { Router } from 'express';
import { getConsumiReport } from '../controllers/reportsController.js';

const router = Router();

router.get('/consumi', getConsumiReport);

export default router;
