const express = require('express');
const { predictChurn } = require('../controllers/predictionController');

const router = express.Router();

router.post('/', predictChurn);

module.exports = router;

