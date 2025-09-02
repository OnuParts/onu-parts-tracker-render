import express from 'express';
import excelExport from './excel-real.js';

const router = express.Router();

// Proper Excel export (not CSV) using xlsx library 
router.get('/api/excel-export', excelExport);

export default router;