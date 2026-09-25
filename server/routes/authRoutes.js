const express = require('express');
const router = express.Router();
const { login, logout, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');

// Existing API contract routes:
// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/me
router.get('/me', auth, getMe);

module.exports = router;
