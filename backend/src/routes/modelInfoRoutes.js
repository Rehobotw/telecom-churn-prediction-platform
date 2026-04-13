const express = require('express');
const modelInfoController = require('../controllers/modelInfoController');

const router = express.Router();

router.get('/', modelInfoController.getModelInfo);

module.exports = router;
