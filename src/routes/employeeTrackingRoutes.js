const express = require('express');
const router = express.Router();
const employeeTrackingController = require('../controllers/employeeTrackingController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.use(authenticateToken);
router.post('/', authorizeRole('MANAGER'), employeeTrackingController.trackEmployeeAction);

module.exports = router; 