// Controller handlers for reports.
import { asyncHandler } from '../middlewares/asyncHandler.js';
import {
    getConsumiMenusData,
    getConsumiReportData,
    getScelteMenusData,
    getScelteReportData,
} from '../services/reportsService.js';

// Returns the data used by consumi menus.
export const getConsumiMenus = asyncHandler(async (req, res) => {
    const out = await getConsumiMenusData();
    res.json(out);
});

// Returns the data used by consumi report.
export const getConsumiReport = asyncHandler(async (req, res) => {
    const out = await getConsumiReportData(req.query || {});
    res.json(out);
});

// Returns the data used by scelte menus.
export const getScelteMenus = asyncHandler(async (req, res) => {
    const out = await getScelteMenusData();
    res.json(out);
});

// Returns the data used by scelte report.
export const getScelteReport = asyncHandler(async (req, res) => {
    const out = await getScelteReportData(req.query || {});
    res.json(out);
});