const express = require('express');

const router = express.Router();

const predictionRoutes = require('./predictionRoutes');
const healthRoutes = require('./healthRoutes');

router.use('/predict', predictionRoutes);
router.use('/health', healthRoutes);

module.exports = router;

