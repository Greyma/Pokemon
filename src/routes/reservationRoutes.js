const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticateToken } = require('../middleware/auth');

// Routes protégées par l'authentification
router.use(authenticateToken);

// Créer une nouvelle réservation
router.post('/', reservationController.createReservation);

// Obtenir toutes les réservations
router.get('/', reservationController.getAllReservations);

// Obtenir une réservation spécifique
router.get('/:id', reservationController.getReservationById);

// Mettre à jour le statut d'une réservation
router.patch('/:id/status', reservationController.updateStatus);

// Ajouter un paiement à une réservation
router.post('/:id/payments', reservationController.addPayment);

// Calculer le prix d'une réservation
router.post('/calculate-price', reservationController.calculatePrice);

// Calculer l'acompte d'une réservation
router.post('/calculate-deposit', reservationController.calculateDeposit);

module.exports = router; 