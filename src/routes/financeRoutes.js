const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { User, Reservation } = require('../models');
const { Op } = require('sequelize');

// Suivi quotidien des paiements
router.get('/daily', authenticateToken, authorizeRole(['MANAGER']), async (req, res) => {
  try {
    const { date, method } = req.query;
    
    if (!date || !method) {
      return res.status(400).json({ message: 'Date et méthode de paiement requises' });
    }

    const reservations = await Reservation.findAll({
      where: {
        paymentMethod: method,
        createdAt: {
          [Op.gte]: new Date(date),
          [Op.lt]: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
        }
      }
    });

    const total = reservations.reduce((sum, res) => sum + res.totalPrice, 0);
    const byReservation = reservations.map(res => ({
      reservationId: res.id,
      amount: res.totalPrice
    }));

    res.json({
      data: {
        total,
        byReservation
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Suivi financier par employé
router.get('/employee', authenticateToken, authorizeRole(['MANAGER']), async (req, res) => {
  try {
    const { username, date } = req.query;
    
    if (!username || !date) {
      return res.status(400).json({ message: 'Nom d\'utilisateur et date requis' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const reservations = await Reservation.findAll({
      where: {
        createdBy: user.id,
        createdAt: {
          [Op.gte]: new Date(date),
          [Op.lt]: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
        }
      }
    });

    const cash = reservations
      .filter(res => res.paymentMethod === 'CASH')
      .reduce((sum, res) => sum + res.totalPrice, 0);

    const ccp = reservations
      .filter(res => res.paymentMethod === 'CCP')
      .reduce((sum, res) => sum + res.totalPrice, 0);

    res.json({
      data: {
        cash,
        ccp,
        total: cash + ccp
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 