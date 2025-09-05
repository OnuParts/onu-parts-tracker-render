import express from 'express';
import excelExport from './excel-api-based.js';

const router = express.Router();

// Register the endpoint at ALL possible paths to ensure it's accessible from any URL
router.get('/api/excel-export', excelExport);
router.get('/api/excel-api', excelExport);
router.get('/api/excel-final', excelExport);  // This is the URL that's actually being called
router.get('/api/excel', excelExport);
router.get('/excel-export', excelExport);

export default router;