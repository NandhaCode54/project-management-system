const express = require('express');

const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { registerSchema, loginSchema } = require('../validators/auth');

const router = express.Router();

router.post('/register', authLimiter, validate.body(registerSchema), authController.register);
router.post('/login', authLimiter, validate.body(loginSchema), authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);

module.exports = router;