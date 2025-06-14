const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { authenticateToken, hasRole } = require('../middleware/auth');

router.use(authenticateToken);
router.post('/', hasRole('MANAGER'), maintenanceController.toggleMaintenanceMode);

module.exports = router; 