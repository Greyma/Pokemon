const express = require('express');
const router = express.Router();
const employeeTrackingController = require('../controllers/employeeTrackingController');
const { authenticateToken, hasRole } = require('../middleware/auth');

router.use(authenticateToken);
router.post('/', hasRole('MANAGER'), employeeTrackingController.trackEmployeeAction);

module.exports = router; 