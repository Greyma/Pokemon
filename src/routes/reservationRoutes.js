const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticateToken, hasRole } = require('../middleware/auth');

// Routes protégées par l'authentification
router.use(authenticateToken);

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/available-rooms', reservationController.getAvailableRooms);
router.get('/rooms', reservationController.getAvailableRooms);
router.get('/available-activities', reservationController.getAvailableActivities);
router.get('/available-supplements', reservationController.getAvailableSupplements);
router.get('/convention/:conventionId/reservations', reservationController.getConventionReservations);
router.get('/room/:roomId/reservations', reservationController.getRoomReservations);
router.get('/:id', reservationController.getReservationById);
router.get('/', reservationController.getAllReservations);
router.post('/calculate-price', reservationController.calculatePrice);
router.post('/calculate-deposit', reservationController.calculateDeposit);

// Routes accessibles aux réceptionnistes et managers
router.post('/', hasRole(['RECEPTIONIST', 'MANAGER']), reservationController.createReservation);
router.put('/:id', hasRole(['RECEPTIONIST', 'MANAGER']), reservationController.updateReservation);
router.patch('/:id/real-dates', hasRole(['RECEPTIONIST', 'MANAGER']), reservationController.updateRealDates);
router.post('/:id/payments', hasRole(['RECEPTIONIST', 'MANAGER']), reservationController.addPayment);
router.post('/upload/payment-proof', hasRole(['RECEPTIONIST', 'MANAGER']), reservationController.uploadPdf);

// Routes nécessitant des droits de manager ou réceptionniste
router.patch('/:id/status', hasRole(['MANAGER', 'RECEPTIONIST']), reservationController.updateStatus);
router.delete('/:id', hasRole(['MANAGER', 'RECEPTIONIST']), reservationController.deleteReservation);

module.exports = router; 