const express = require('express');
const router = express.Router();
const { generateActivityPDF, ActivityController } = require('../controllers/activityController');
const { authenticateToken, hasRole } = require('../middleware/auth');

// Routes CRUD pour les activités
// Récupérer toutes les activités
router.get('/', 
  authenticateToken, 
  hasRole(['MANAGER', 'RECEPTIONIST']), 
  ActivityController.getAllActivities
);

// Rechercher des activités
router.get('/search', 
  authenticateToken, 
  hasRole(['MANAGER', 'RECEPTIONIST']), 
  ActivityController.searchActivities
);

// Obtenir les activités actives
router.get('/active/list', 
  authenticateToken, 
  hasRole(['MANAGER', 'RECEPTIONIST']), 
  ActivityController.getActiveActivities
);

// Récupérer une activité par ID
router.get('/:id', 
  authenticateToken, 
  hasRole(['MANAGER', 'RECEPTIONIST']), 
  ActivityController.getActivityById
);

// Créer une nouvelle activité
router.post('/', 
  authenticateToken, 
  hasRole(['MANAGER']), 
  ActivityController.createActivity
);

// Modifier une activité
router.put('/:id', 
  authenticateToken, 
  hasRole(['MANAGER']), 
  ActivityController.updateActivity
);

// Supprimer une activité
router.delete('/:id', 
  authenticateToken, 
  hasRole(['MANAGER']), 
  ActivityController.deleteActivity
);

// Activer/Désactiver une activité
router.patch('/:id/toggle-status', 
  authenticateToken, 
  hasRole(['MANAGER']), 
  ActivityController.toggleActivityStatus
);

// Route pour générer les PDFs des activités
router.post('/generate-pdf', 
  authenticateToken, 
  hasRole(['MANAGER']), 
  generateActivityPDF
);

// Rapport de présence à une activité sur une période
router.get('/report/:activityId', 
  authenticateToken, 
  hasRole(['MANAGER', 'RECEPTIONIST']), 
  ActivityController.reportActivityPresence
);

module.exports = router; 