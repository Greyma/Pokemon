const express = require('express');
const router = express.Router();
const ConventionController = require('../controllers/conventionController');
const { authenticateToken, hasRole } = require('../middleware/auth');
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
const requireManager = hasRole(['MANAGER']);

// Routes principales
// GET /api/conventions - Récupérer toutes les conventions (Manager et Réceptionniste)
router.get('/', 
  authenticateToken, 
  requireManagerOrReceptionist, 
  validateQueryParams,
  ConventionController.getAllConventions
);

// GET /api/conventions/stats - Obtenir les statistiques des conventions
router.get('/stats', 
  authenticateToken, 
  requireManagerOrReceptionist, 
  ConventionController.getConventionStats
);

// GET /api/conventions/search - Rechercher des conventions par société
router.get('/search', 
  authenticateToken, 
  requireManagerOrReceptionist, 
  validateSearchBySociete,
  ConventionController.searchConventionsBySociete
);

// GET /api/conventions/active - Obtenir les conventions actives
router.get('/active', 
  authenticateToken, 
  requireManagerOrReceptionist, 
  ConventionController.getActiveConventions
);

// POST /api/conventions - Créer une nouvelle convention (Manager uniquement)
router.post('/', 
  authenticateToken, 
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
  requireManagerOrReceptionist, 
  validateId,
  ConventionController.getConventionById
);

// PUT /api/conventions/:id - Modifier une convention (Manager uniquement)
router.put('/:id', 
  authenticateToken, 
  requireManager, 
  validateUpdateConvention,
  ConventionController.updateConvention
);

// DELETE /api/conventions/:id - Supprimer une convention (Manager uniquement)
router.delete('/:id', 
  authenticateToken, 
  requireManager, 
  validateId,
  ConventionController.deleteConvention
);

// Routes pour les fichiers
// POST /api/conventions/:id/upload-justificatif - Upload du justificatif (Manager uniquement)
router.post('/:id/upload-justificatif', 
  authenticateToken, 
  requireManager, 
  validateId,
  validateFileType(conventionAllowedTypes),
  ConventionController.uploadJustificatif
);

// GET /api/conventions/:id/download-justificatif - Télécharger le justificatif
router.get('/:id/download-justificatif', 
  authenticateToken, 
  requireManagerOrReceptionist, 
  validateId,
  ConventionController.downloadJustificatif
);

module.exports = router; 