import { asyncHandler } from '../middlewares/asyncHandler.js';
import * as service from '../services/dashboardService.js';

export const getDashboard = asyncHandler(async (req, res) => {
    const out = await service.getDashboard(req.user);
    res.json(out);
});
