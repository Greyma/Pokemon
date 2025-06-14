const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authenticateToken, hasRole } = require('../middleware/auth');
const { Room, Reservation, User } = require('../models');
const { Op } = require('sequelize');

router.use(authenticateToken);

// Statistiques de revenus
router.get('/revenue', hasRole('MANAGER'), statisticsController.getRevenueStats);

// Statistiques d'occupation
router.get('/occupation', hasRole('MANAGER'), async (req, res) => {
  try {
    const totalRooms = await Room.count();
    const occupiedRooms = await Room.count({
      where: { status: 'OCCUPÉE' }
    });
    const reservedRooms = await Room.count({
      where: { status: 'RÉSERVÉE' }
    });
    const availableRooms = await Room.count({
      where: { status: 'LIBRE' }
    });

    res.json({
      data: {
        totalRooms,
        occupiedRooms,
        reservedRooms,
        availableRooms,
        occupancyRate: (occupiedRooms / totalRooms) * 100,
        reservationRate: (reservedRooms / totalRooms) * 100,
        availabilityRate: (availableRooms / totalRooms) * 100
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Statistiques par type de chambre
router.get('/by-room-type', hasRole('MANAGER'), async (req, res) => {
  try {
    const roomTypes = await Room.findAll({
      attributes: ['type'],
      group: ['type']
    });

    const stats = {};
    for (const roomType of roomTypes) {
      const type = roomType.type;
      const totalRooms = await Room.count({ where: { type } });
      const occupiedRooms = await Room.count({
        where: { type, status: 'OCCUPÉE' }
      });
      const reservedRooms = await Room.count({
        where: { type, status: 'RÉSERVÉE' }
      });
      const availableRooms = await Room.count({
        where: { type, status: 'LIBRE' }
      });

      stats[type] = {
        totalRooms,
        occupiedRooms,
        reservedRooms,
        availableRooms,
        occupancyRate: (occupiedRooms / totalRooms) * 100,
        reservationRate: (reservedRooms / totalRooms) * 100,
        availabilityRate: (availableRooms / totalRooms) * 100
      };
    }

    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Statistiques des clients
router.get('/clients', hasRole('MANAGER'), async (req, res) => {
  try {
    const totalClients = await User.count({
      where: { role: 'CLIENT' }
    });

    const activeClients = await User.count({
      where: {
        role: 'CLIENT',
        isActive: true
      }
    });

    const reservations = await Reservation.findAll({
      include: [{
        model: User,
        as: 'user',
        where: { role: 'CLIENT' }
      }]
    });

    const clientStats = {
      totalClients,
      activeClients,
      inactiveClients: totalClients - activeClients,
      averageReservationsPerClient: reservations.length / totalClients,
      newClientsThisMonth: await User.count({
        where: {
          role: 'CLIENT',
          createdAt: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    };

    res.json({ data: clientStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Statistiques des chambres populaires
router.get('/popular-rooms', hasRole('MANAGER'), statisticsController.getPopularRoomsStats);

module.exports = router;