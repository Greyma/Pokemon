const express = require('express');
const router = express.Router();
const { generateActivityPDF } = require('../controllers/activityController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Route pour générer les PDFs des activités
router.post('/generate-pdf', 
  authenticateToken, 
  authorizeRole(['MANAGER']), 
  async (req, res) => {
    try {
      const { type, date } = req.body;
      
      if (!type || !date) {
        return res.status(400).json({
          success: false,
          message: 'Type et date requis'
        });
      }

      if (!['restaurant', 'pool', 'gym'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type d\'activité invalide'
        });
      }

      const result = await generateActivityPDF(type, date);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router; 