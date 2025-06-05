const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Routes protégées par authentification
router.use(authenticateToken);

// Routes pour les managers
router.get('/', authorizeRole(['MANAGER']), userController.getAllUsers);
router.post('/', authorizeRole(['MANAGER']), userController.createUser);
router.get('/stats', authorizeRole(['MANAGER']), userController.getUserStats);

module.exports = router; 