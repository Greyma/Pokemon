const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.use(authenticateToken);
router.post('/', authorizeRole('MANAGER'), maintenanceController.toggleMaintenanceMode);

module.exports = router; 