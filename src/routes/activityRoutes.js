const express = require('express');
const router = express.Router();
const { generateActivityPDF } = require('../controllers/activityController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Route pour générer les PDFs des activités
router.post('/generate-pdf', 
  authenticateToken, 
  authorizeRole(['MANAGER']), 
  generateActivityPDF
);

module.exports = router; 