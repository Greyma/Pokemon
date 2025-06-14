const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticateToken, isManager, isReceptionist, hasRole } = require('../middleware/auth');

// Routes protégées par l'authentification
router.use(authenticateToken);

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/rooms', reservationController.getAvailableRooms);
router.get('/', reservationController.getAllReservations);
router.get('/:id', reservationController.getReservationById);
router.post('/calculate-price', reservationController.calculatePrice);
router.post('/calculate-deposit', reservationController.calculateDeposit);

// Routes nécessitant des droits de réceptionniste
router.post('/', isReceptionist, reservationController.createReservation);
router.patch('/:id/real-dates', isReceptionist, reservationController.updateRealDates);
router.post('/:id/payments', isReceptionist, reservationController.addPayment);
router.post('/upload/payment-proof', isReceptionist, reservationController.uploadPdf);

// Routes nécessitant des droits de manager
router.patch('/:id/status', hasRole(['MANAGER', 'RECEPTIONIST']), reservationController.updateStatus);

module.exports = router; 