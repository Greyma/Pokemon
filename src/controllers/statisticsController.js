const { Reservation, Room, User } = require('../models');
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
    const totalRooms = await Room.count();
    const occupiedRooms = await Room.count({
      where: { status: 'OCCUPÉE' }
    });
    const reservedRooms = await Room.count({
      where: { status: 'RÉSERVÉE' }
    });
    const availableRooms = await Room.count({
      where: { status: 'DISPONIBLE' }
    });

    const occupancyRate = (occupiedRooms / totalRooms) * 100;
    const reservationRate = (reservedRooms / totalRooms) * 100;
    const availabilityRate = (availableRooms / totalRooms) * 100;

    res.json({
      success: true,
      data: {
        totalRooms,
        occupiedRooms,
        reservedRooms,
        availableRooms,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        reservationRate: Math.round(reservationRate * 100) / 100,
        availabilityRate: Math.round(availabilityRate * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
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

exports.getStatsByRoomType = async (req, res) => {
  try {
    const roomTypes = await Room.findAll({
      attributes: ['type'],
      group: ['type']
    });

    const stats = await Promise.all(roomTypes.map(async (roomType) => {
      const totalRooms = await Room.count({
        where: { type: roomType.type }
      });

      const occupiedRooms = await Room.count({
        where: {
          type: roomType.type,
          status: 'OCCUPÉE'
        }
      });

      const reservedRooms = await Room.count({
        where: {
          type: roomType.type,
          status: 'RÉSERVÉE'
        }
      });

      const availableRooms = await Room.count({
        where: {
          type: roomType.type,
          status: 'DISPONIBLE'
        }
      });

      const occupancyRate = (occupiedRooms / totalRooms) * 100;
      const reservationRate = (reservedRooms / totalRooms) * 100;
      const availabilityRate = (availableRooms / totalRooms) * 100;

      return {
        type: roomType.type,
        totalRooms,
        occupiedRooms,
        reservedRooms,
        availableRooms,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        reservationRate: Math.round(reservationRate * 100) / 100,
        availabilityRate: Math.round(availabilityRate * 100) / 100
      };
    }));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getClientStats = async (req, res) => {
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
        where: { role: 'CLIENT' },
        attributes: ['id']
      }]
    });

    const reservationsPerClient = totalClients > 0 ? reservations.length / totalClients : 0;

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const newClients = await User.count({
      where: {
        role: 'CLIENT',
        createdAt: {
          [Op.gte]: currentMonth
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalClients,
        activeClients,
        reservationsPerClient: Math.round(reservationsPerClient * 100) / 100,
        newClientsThisMonth: newClients
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};