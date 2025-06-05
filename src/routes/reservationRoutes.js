const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Routes protégées par authentification
router.use(authenticateToken);

// Routes pour les réceptionnistes
router.post('/', authorizeRole('RECEPTIONIST'), reservationController.createReservation);
router.patch('/:id/payment', authorizeRole('RECEPTIONIST'), reservationController.updatePaymentStatus);

// Routes pour tous les utilisateurs authentifiés
router.get('/', reservationController.getAllReservations);
router.get('/:id', reservationController.getReservationById);

module.exports = router; 