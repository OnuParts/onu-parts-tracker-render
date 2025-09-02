import express from 'express';
import excelExportFix from './excel-export-fix.js';

const router = express.Router();

// Register the working Excel export at the exact path the frontend expects
router.get('/api/parts-issuance/export', excelExportFix);

export default router;