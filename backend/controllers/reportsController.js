import { asyncHandler } from '../middlewares/asyncHandler.js';
import {
    getConsumiMenusData,
    getConsumiReportData,
    getScelteMenusData,
    getScelteReportData,
} from '../services/reportsService.js';

export const getConsumiMenus = asyncHandler(async (req, res) => {
    const out = await getConsumiMenusData();
    res.json(out);
});

export const getConsumiReport = asyncHandler(async (req, res) => {
    const out = await getConsumiReportData(req.query || {});
    res.json(out);
});

export const getScelteMenus = asyncHandler(async (req, res) => {
    const out = await getScelteMenusData();
    res.json(out);
});

export const getScelteReport = asyncHandler(async (req, res) => {
    const out = await getScelteReportData(req.query || {});
    res.json(out);
});
