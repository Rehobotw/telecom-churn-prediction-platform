const express = require('express');
const predictionController = require('../controllers/predictionController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post('/', validateRequest.validatePrediction, predictionController.predictChurn);

module.exports = router;