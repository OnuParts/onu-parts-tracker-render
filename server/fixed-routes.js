import express from 'express';
import fixedExport from './fixed-export.js';

const router = express.Router();

// Ultra-reliable direct export endpoint
router.get('/api/fixed-export', fixedExport);

export default router;
