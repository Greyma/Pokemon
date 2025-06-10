const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const fileUpload = require('express-fileupload');

// Middleware pour l'upload de fichiers avec configuration et logs
router.use(fileUpload({
  debug: true,
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  abortOnLimit: true,
  responseOnLimit: 'Fichier trop volumineux',
  safeFileNames: true,
  preserveExtension: true
}));

// Middleware de logging pour les uploads
router.use((req, res, next) => {
  if (req.files) {
    console.log('📦 Fichiers reçus:', {
      files: Object.keys(req.files),
      body: req.body
    });
  }
  next();
});

// Routes protégées par authentification
router.use(authenticateToken);

// Routes pour les réceptionnistes et les managers
router.get('/available-rooms', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.getAvailableRooms);
router.post('/calculate-price', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.calculatePrice);
router.get('/', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.getAllReservations);
router.post('/', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.createReservation);
router.get('/:id', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.getReservationById);
router.patch('/:id/payment', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.updatePaymentStatus);
router.post('/:id/invoice', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.generateInvoice);
router.get('/:id/payment-history', authorizeRole(['RECEPTIONIST', 'MANAGER']), reservationController.getPaymentHistory);

module.exports = router; 