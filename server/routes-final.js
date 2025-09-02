import express from 'express';
import excelExport from './excel-working.js';

const router = express.Router();

// Register ONLY at /api/excel-final to match exactly what the frontend is calling
router.get('/api/excel-final', excelExport);

export default router;