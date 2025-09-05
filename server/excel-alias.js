import express from 'express';
import excelExport from './excel-correct.js';

const router = express.Router();

// Create an alias for '/api/excel-export' to use our working implementation
router.get('/api/excel-export', excelExport);

// Also register the original route as backup
router.get('/api/excel-all', excelExport);

export default router;