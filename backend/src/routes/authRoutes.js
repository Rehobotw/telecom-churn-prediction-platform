const express = require('express');
const authController = require('../controllers/authController');
const { attachAuth, requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', authController.login);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', attachAuth, authController.logout);
router.post('/test-email', attachAuth, requireAuth, authController.sendTestEmail);
router.post('/notification-alert', attachAuth, requireAuth, authController.sendNotificationAlert);
router.get('/me', attachAuth, requireAuth, authController.me);
router.patch('/email', attachAuth, requireAuth, authController.updateEmail);
router.patch('/password', attachAuth, requireAuth, authController.updatePassword);
router.patch('/preferences', attachAuth, requireAuth, authController.updatePreferences);

module.exports = router;
