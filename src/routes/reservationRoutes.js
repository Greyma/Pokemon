const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Routes protégées par authentification
router.use(authenticateToken);

// Routes pour les réceptionnistes et les managers
router.get('/available-rooms', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.getAvailableRooms);
router.post('/calculate-price', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.calculatePrice);
router.post('/calculate-deposit', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.calculateDeposit);
router.get('/', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.getAllReservations);
router.post('/', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.createReservation);
router.get('/:id', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.getReservationById);
router.patch('/:id/payment', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.updatePaymentStatus);
router.post('/:id/invoice', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.generateInvoice);
router.get('/:id/payment-history', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.getPaymentHistory);

// Route pour l'upload de fichiers CCP
router.post('/upload-ccp', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.uploadPdf);

module.exports = router; 