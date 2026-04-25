const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const predictionRoutes = require('./predictionRoutes');
const batchRoutes = require('./batchRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const metricsRoutes = require('./metricsRoutes');
const customerRoutes = require('./customerRoutes');

router.use('/health', healthRoutes);
router.use('/predict', predictionRoutes);
router.use('/batch', batchRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/metrics', metricsRoutes);
router.use('/customers', customerRoutes);

module.exports = router;