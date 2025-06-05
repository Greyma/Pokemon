const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/revenue', authorizeRole('MANAGER'), statisticsController.getRevenueStats);
router.get('/occupancy', authorizeRole('MANAGER'), statisticsController.getOccupancyStats);
router.get('/popular-rooms', authorizeRole('MANAGER'), statisticsController.getPopularRoomsStats);

module.exports = router;