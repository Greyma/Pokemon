const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const fileUpload = require('express-fileupload');

// Middleware pour l'upload de fichiers
router.use(fileUpload());

// Routes protégées par authentification
router.use(authenticateToken);

// Routes pour les réceptionnistes
router.post('/', authorizeRole('RECEPTIONIST'), reservationController.createReservation);
router.post('/calculate-price', authorizeRole('RECEPTIONIST'), reservationController.calculatePrice);
router.post('/deposit', authorizeRole('RECEPTIONIST'), reservationController.handleDeposit);
router.post('/upload-pdf', authorizeRole('RECEPTIONIST'), reservationController.uploadPdf);
router.patch('/:id/payment', authorizeRole('RECEPTIONIST'), reservationController.updatePaymentStatus);

// Routes pour tous les utilisateurs authentifiés
router.get('/', reservationController.getAllReservations);
router.get('/:id', reservationController.getReservationById);

module.exports = router; 