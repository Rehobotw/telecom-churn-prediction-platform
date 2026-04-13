const express = require('express');
const multer = require('multer');
const batchController = require('../controllers/batchController');
const config = require('../config/config');

const router = express.Router();
const upload = multer({
  dest: config.UPLOADS_DIR,
  limits: { fileSize: config.MAX_UPLOAD_SIZE_BYTES },
});

router.post('/', upload.single('file'), batchController.predictBatch);

module.exports = router;
