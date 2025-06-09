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

// Route publique pour obtenir les chambres disponibles
router.get('/available-rooms', reservationController.getAvailableRooms);

// Routes protégées par authentification
router.use(authenticateToken);

// Routes pour les réceptionnistes
router.post('/', authorizeRole('RECEPTIONIST'), reservationController.createReservation);
router.post('/calculate-price', authorizeRole(['MANAGER', 'RECEPTIONIST']), reservationController.calculatePrice);
router.post('/deposit', authorizeRole(['MANAGER', 'RECEPTIONIST']), reservationController.handleDeposit);
router.post('/upload-pdf', authorizeRole('RECEPTIONIST'), reservationController.uploadPdf);
router.patch('/:id/payment', authorizeRole('RECEPTIONIST'), reservationController.updatePaymentStatus);

// Routes pour tous les utilisateurs authentifiés
router.get('/', reservationController.getAllReservations);
router.get('/:id', reservationController.getReservationById);

module.exports = router; 