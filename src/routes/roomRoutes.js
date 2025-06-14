const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticateToken, hasRole } = require('../middleware/auth');

// Routes protégées par authentification
router.use(authenticateToken);

// Routes pour les managers
router.post('/', hasRole('MANAGER'), roomController.createRoom);
router.put('/:id', hasRole('MANAGER'), roomController.updateRoom);
router.patch('/:id/status', hasRole('MANAGER'), roomController.updateRoomStatus);
router.patch('/:id/release', hasRole('MANAGER'), roomController.releaseRoom);

// Routes pour tous les utilisateurs authentifiés
router.get('/', roomController.getAllRooms);
router.get('/available', roomController.getAvailableRooms);
router.get('/:number', roomController.getRoomByNumber);

module.exports = router; 