import express from 'express';
import excelExport from './excel-working.js';

const router = express.Router();

// Register all endpoints to the same handler to ensure it works
router.get('/api/excel-export', excelExport);
router.get('/api/excel-final', excelExport);
router.get('/api/excel-working', excelExport);

export default router;