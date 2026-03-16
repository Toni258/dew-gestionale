// Express routes for dashboard.
import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController.js';

// Route definitions
const router = Router();

router.get('/', getDashboard);

export default router;