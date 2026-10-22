const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/preferences', authController.getPreferences);
router.patch('/preferences', authController.updatePreferences);
router.post('/test-email', authController.sendTestEmail);
router.post('/notification-alert', authController.sendNotificationAlert);
router.get('/me', authController.me);

module.exports = router;

