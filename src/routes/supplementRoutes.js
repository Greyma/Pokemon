const express = require('express');
const router = express.Router();
const supplementController = require('../controllers/supplementController');
const { authenticateToken, hasRole } = require('../middleware/auth');

// Routes protégées par authentification
router.use(authenticateToken);

// Routes pour les managers (CRUD complet)
router.post('/', hasRole('MANAGER'), supplementController.createSupplement);
router.put('/:id', hasRole('MANAGER'), supplementController.updateSupplement);
router.delete('/:id', hasRole('MANAGER'), supplementController.deleteSupplement);
router.patch('/:id/activate', hasRole('MANAGER'), supplementController.activateSupplement);

// Routes pour les managers (lecture de tous les suppléments)
router.get('/admin', hasRole('MANAGER'), supplementController.getAllSupplementsAdmin);

// Routes pour tous les utilisateurs authentifiés (lecture des suppléments actifs)
router.get('/', supplementController.getAllSupplements);
router.get('/:id', supplementController.getSupplementById);

module.exports = router; 