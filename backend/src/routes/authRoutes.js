const express = require('express');
const authController = require('../controllers/authController');
const { attachAuth, requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', attachAuth, authController.logout);
router.get('/me', attachAuth, requireAuth, authController.me);
router.patch('/email', attachAuth, requireAuth, authController.updateEmail);
router.patch('/password', attachAuth, requireAuth, authController.updatePassword);

module.exports = router;
