const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const Room = require('../models/Room');

// Obtenir toutes les chambres
router.get('/', authenticateToken, roomController.getAllRooms);

// Obtenir les chambres disponibles
router.get('/available', authenticateToken, roomController.getAvailableRooms);

// Créer une nouvelle chambre (Manager uniquement)
router.post('/', authenticateToken, authorizeRole(['MANAGER']), roomController.createRoom);

// Mettre à jour une chambre (Manager uniquement)
router.put('/:id', authenticateToken, authorizeRole(['MANAGER']), roomController.updateRoom);

// Désactiver une chambre (Manager uniquement)
router.delete('/:id', authenticateToken, authorizeRole(['MANAGER']), async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Chambre non trouvée'
      });
    }
    await room.update({ isActive: false });
    res.json({
      status: 'success',
      message: 'Chambre désactivée avec succès'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de la désactivation de la chambre'
    });
  }
});

// Libérer une chambre (Manager uniquement)
router.patch('/:id/release', authenticateToken, authorizeRole(['MANAGER']), roomController.releaseRoom);

module.exports = router; 