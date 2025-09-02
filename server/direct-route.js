
import express from 'express';
import directExcel from './direct-excel.js';

const router = express.Router();

// Ultra-reliable direct Excel export endpoint
router.get('/api/direct-excel', directExcel);

export default router;
