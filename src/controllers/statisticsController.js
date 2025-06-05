const { Reservation, Room } = require('../models');
const { Op } = require('sequelize');

exports.getRevenueStats = async (req, res) => {
  try {
    const { period } = req.query; // format attendu : 'YYYY-MM'
    if (!period) {
      return res.status(400).json({ status: 'error', message: 'Période manquante' });
    }

    const [year, month] = period.split('-');
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Récupérer toutes les réservations du mois
    const reservations = await Reservation.findAll({
      where: {
        checkInDate: { [Op.gte]: startDate, [Op.lt]: endDate }
      },
      include: [{ model: Room }]
    });

    // Calcul du revenu total et par type de chambre
    let totalRevenue = 0;
    const revenueByRoomType = { STANDARD: 0, VIP: 0, SUITE: 0 };
    for (const res of reservations) {
      totalRevenue += Number(res.totalPrice);
      if (res.Room && res.Room.type) {
        revenueByRoomType[res.Room.type] += Number(res.totalPrice);
      }
    }

    // Taux de remplissage (optionnel)
    const totalRooms = await Room.count();
    const occupiedRooms = reservations.length;
    const occupancyRate = totalRooms ? (occupiedRooms / totalRooms) * 100 : 0;

    res.json({
      status: 'success',
      data: {
        totalRevenue,
        revenueByRoomType,
        occupancyRate
      }
    });
  } catch (error) {
    console.error('Erreur statistiques revenus:', error);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la récupération des statistiques de revenus' });
  }
};

exports.getOccupancyStats = async (req, res) => {
  try {
    const { period } = req.query; // format attendu : 'YYYY-MM'
    if (!period) {
      return res.status(400).json({ status: 'error', message: 'Période manquante' });
    }

    const [year, month] = period.split('-');
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Récupérer toutes les réservations du mois
    const reservations = await Reservation.findAll({
      where: {
        checkInDate: { [Op.gte]: startDate, [Op.lt]: endDate }
      },
      include: [{ model: Room }]
    });

    // Calcul du taux de remplissage
    const totalRooms = await Room.count();
    const occupiedRooms = reservations.length;
    const occupancyRate = totalRooms ? (occupiedRooms / totalRooms) * 100 : 0;

    res.json({
      status: 'success',
      data: {
        totalRooms,
        occupiedRooms,
        occupancyRate
      }
    });
  } catch (error) {
    console.error('Erreur statistiques taux de remplissage:', error);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la récupération du taux de remplissage' });
  }
};

exports.getPopularRoomsStats = async (req, res) => {
  try {
    const { period } = req.query; // format attendu : 'YYYY-MM'
    if (!period) {
      return res.status(400).json({ status: 'error', message: 'Période manquante' });
    }

    const [year, month] = period.split('-');
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Récupérer toutes les réservations du mois
    const reservations = await Reservation.findAll({
      where: {
        checkInDate: { [Op.gte]: startDate, [Op.lt]: endDate }
      },
      include: [{ model: Room }]
    });

    // Calcul des chambres populaires par type
    const byType = { STANDARD: 0, VIP: 0, SUITE: 0 };
    for (const res of reservations) {
      if (res.Room && res.Room.type) {
        byType[res.Room.type]++;
      }
    }

    res.json({
      status: 'success',
      data: { byType }
    });
  } catch (error) {
    console.error('Erreur statistiques chambres populaires:', error);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la récupération des chambres populaires' });
  }
};