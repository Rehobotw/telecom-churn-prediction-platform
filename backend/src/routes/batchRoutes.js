const express = require('express');
const multer = require('multer');
const batchController = require('../controllers/batchController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), batchController.predictBatch);

module.exports = router;