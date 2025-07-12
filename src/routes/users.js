const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, hasRole } = require('../middleware/auth');

// Routes protégées par authentification
router.use(authenticateToken);

// Route pour récupérer les informations de l'utilisateur connecté
router.get('/me', userController.getCurrentUser);

// Routes pour les managers
router.get('/', hasRole(['MANAGER']), userController.getAllUsers);
router.post('/', hasRole(['MANAGER']), userController.createUser);
router.get('/stats', hasRole(['MANAGER']), userController.getUserStats);
router.get('/:id', hasRole(['MANAGER']), userController.getUserById);
router.put('/:id', hasRole(['MANAGER']), userController.updateUser);
router.patch('/:id/status', hasRole(['MANAGER']), userController.deactivateUser);
router.patch('/:id/password', hasRole(['MANAGER']), userController.changePassword);
router.delete('/:id', hasRole(['MANAGER']), userController.deleteUser);

module.exports = router; 