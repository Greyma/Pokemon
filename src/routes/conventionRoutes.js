const express = require('express');
const router = express.Router();
const ConventionController = require('../controllers/conventionController');
const { authenticateToken, hasRole, validateUserFromToken, requireManager } = require('../middleware/auth');
const { conventionFileUpload, validateFileType, conventionAllowedTypes } = require('../middleware/fileUpload');
const { 
  validateCreateConvention, 
  validateUpdateConvention, 
  validateQueryParams, 
  validateId, 
  validateSearchBySociete
} = require('../middleware/validation');

// Middleware pour vérifier les permissions
const requireManagerOrReceptionist = hasRole(['MANAGER', 'RECEPTIONIST']);

// Routes principales
// GET /api/conventions - Récupérer toutes les conventions (Manager et Réceptionniste)
router.get('/', 
  authenticateToken, 
  validateUserFromToken,
  requireManagerOrReceptionist, 
  validateQueryParams,
  ConventionController.getAllConventions
);

// GET /api/conventions/stats - Obtenir les statistiques des conventions
router.get('/stats', 
  authenticateToken, 
  validateUserFromToken,
  requireManagerOrReceptionist, 
  ConventionController.getConventionStats
);

// GET /api/conventions/search - Rechercher des conventions par société
router.get('/search', 
  authenticateToken, 
  validateUserFromToken,
  requireManagerOrReceptionist, 
  validateSearchBySociete,
  ConventionController.searchConventionsBySociete
);

// GET /api/conventions/active - Obtenir les conventions actives
router.get('/active', 
  authenticateToken, 
  validateUserFromToken,
  requireManagerOrReceptionist, 
  ConventionController.getActiveConventions
);

// POST /api/conventions - Créer une nouvelle convention (Manager uniquement)
router.post('/', 
  authenticateToken, 
  validateUserFromToken,
  requireManager, 
  validateCreateConvention,
  ConventionController.createConvention
);

// Configuration de express-file-upload pour les justificatifs
router.use('/:id/upload-justificatif', conventionFileUpload);

// Routes avec paramètres ID (doivent être après les routes spécifiques)
// GET /api/conventions/:id - Récupérer une convention spécifique
router.get('/:id', 
  authenticateToken, 
  validateUserFromToken,
  requireManagerOrReceptionist, 
  validateId,
  ConventionController.getConventionById
);

// GET /api/conventions/:id/details - Récupérer les détails complets d'une convention
router.get('/:id/details', 
  authenticateToken, 
  validateUserFromToken,
  requireManagerOrReceptionist, 
  validateId,
  ConventionController.getConventionDetails
);

// PUT /api/conventions/:id - Modifier une convention (Manager uniquement)
router.put('/:id', 
  authenticateToken, 
  validateUserFromToken,
  requireManager, 
  validateUpdateConvention,
  ConventionController.updateConvention
);

// DELETE /api/conventions/:id - Supprimer une convention (Manager uniquement)
router.delete('/:id', 
  authenticateToken, 
  validateUserFromToken,
  requireManager, 
  validateId,
  ConventionController.deleteConvention
);

// Routes pour les fichiers
// POST /api/conventions/:id/upload-justificatif - Upload du justificatif (Manager uniquement)
router.post('/:id/upload-justificatif', 
  authenticateToken, 
  validateUserFromToken,
  requireManager, 
  validateId,
  validateFileType(conventionAllowedTypes),
  ConventionController.uploadJustificatif
);

// GET /api/conventions/:id/download-justificatif - Télécharger le justificatif
router.get('/:id/download-justificatif', 
  authenticateToken, 
  validateUserFromToken,
  requireManagerOrReceptionist, 
  validateId,
  ConventionController.downloadJustificatif
);

// Récupérer les activités incluses dans une convention
router.get('/:id/activities', 
  authenticateToken, 
  validateUserFromToken,
  hasRole(['MANAGER', 'RECEPTIONIST']), 
  ConventionController.getConventionActivities
);

module.exports = router; 