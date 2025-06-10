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

// Suivi financier par réceptionniste
router.get('/by-receptionist', authenticateToken, authorizeRole(['MANAGER']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Dates de début et de fin requises' });
    }

    const receptionists = await User.findAll({
      where: { role: 'RECEPTIONIST' }
    });

    const results = {};
    for (const receptionist of receptionists) {
      const reservations = await Reservation.findAll({
        where: {
          createdBy: receptionist.id,
          createdAt: {
            [Op.between]: [new Date(startDate), new Date(endDate)]
          }
        }
      });

      results[receptionist.username] = {
        cash: reservations
          .filter(res => res.paymentMethod === 'CASH')
          .reduce((sum, res) => sum + res.totalPrice, 0),
        ccp: reservations
          .filter(res => res.paymentMethod === 'CCP')
          .reduce((sum, res) => sum + res.totalPrice, 0)
      };
      results[receptionist.username].total = 
        results[receptionist.username].cash + results[receptionist.username].ccp;
    }

    res.json({ data: results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Suivi financier par période
router.get('/by-period', authenticateToken, authorizeRole(['MANAGER']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Dates de début et de fin requises' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Données journalières
    const daily = {};
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const reservations = await Reservation.findAll({
        where: {
          createdAt: {
            [Op.between]: [
              new Date(d.setHours(0, 0, 0, 0)),
              new Date(d.setHours(23, 59, 59, 999))
            ]
          }
        }
      });

      daily[dateStr] = {
        cash: reservations
          .filter(res => res.paymentMethod === 'CASH')
          .reduce((sum, res) => sum + res.totalPrice, 0),
        ccp: reservations
          .filter(res => res.paymentMethod === 'CCP')
          .reduce((sum, res) => sum + res.totalPrice, 0)
      };
      daily[dateStr].total = daily[dateStr].cash + daily[dateStr].ccp;
    }

    // Données hebdomadaires
    const weekly = {};
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
      const weekStart = new Date(d);
      const weekEnd = new Date(d);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const reservations = await Reservation.findAll({
        where: {
          createdAt: {
            [Op.between]: [weekStart, weekEnd]
          }
        }
      });

      const weekKey = `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`;
      weekly[weekKey] = {
        cash: reservations
          .filter(res => res.paymentMethod === 'CASH')
          .reduce((sum, res) => sum + res.totalPrice, 0),
        ccp: reservations
          .filter(res => res.paymentMethod === 'CCP')
          .reduce((sum, res) => sum + res.totalPrice, 0)
      };
      weekly[weekKey].total = weekly[weekKey].cash + weekly[weekKey].ccp;
    }

    // Données mensuelles
    const monthly = {};
    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      
      const reservations = await Reservation.findAll({
        where: {
          createdAt: {
            [Op.between]: [monthStart, monthEnd]
          }
        }
      });

      const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
      monthly[monthKey] = {
        cash: reservations
          .filter(res => res.paymentMethod === 'CASH')
          .reduce((sum, res) => sum + res.totalPrice, 0),
        ccp: reservations
          .filter(res => res.paymentMethod === 'CCP')
          .reduce((sum, res) => sum + res.totalPrice, 0)
      };
      monthly[monthKey].total = monthly[monthKey].cash + monthly[monthKey].ccp;
    }

    res.json({
      data: {
        daily,
        weekly,
        monthly
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 