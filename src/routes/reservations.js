const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuration de Multer pour le stockage des fichiers PDF
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/ccp-proofs');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont acceptés'));
    }
  }
});

// Créer une nouvelle réservation
router.post('/', authenticateToken, reservationController.createReservation);

// Obtenir toutes les réservations
router.get('/', authenticateToken, reservationController.getAllReservations);

// Obtenir une réservation spécifique
router.get('/:id', authenticateToken, reservationController.getReservationById);

// Mettre à jour le statut de paiement
router.patch('/:id/payment', authenticateToken, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const reservation = await Reservation.findByPk(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({
        status: 'error',
        message: 'Réservation non trouvée'
      });
    }

    await reservation.update({ paymentStatus });
    res.json({
      status: 'success',
      data: reservation
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de la mise à jour du statut de paiement'
    });
  }
});

// Upload du justificatif CCP
router.post('/:id/ccp-proof', authenticateToken, upload.single('proof'), async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) {
      return res.status(404).json({
        status: 'error',
        message: 'Réservation non trouvée'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Aucun fichier n\'a été uploadé'
      });
    }

    await reservation.update({
      ccpProofPath: req.file.path
    });

    res.json({
      status: 'success',
      message: 'Justificatif uploadé avec succès'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de l\'upload du justificatif'
    });
  }
});

module.exports = router; 