const { Reservation, Room, User } = require('../models');
const { Op } = require('sequelize');

// Créer une nouvelle réservation
exports.createReservation = async (req, res) => {
  try {
    const {
      clientName,
      clientType,
      numberOfAdults,
      checkInDate,
      checkOutDate,
      paymentMethod,
      paymentStatus,
      roomId
    } = req.body;

    // Validation des données requises
    if (!clientName || !clientType || !numberOfAdults || !checkInDate || !checkOutDate || !paymentMethod || !roomId) {
      return res.status(400).json({
        status: 'error',
        message: 'Données de réservation incomplètes'
      });
    }

    // Validation du nombre d'adultes
    if (numberOfAdults <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Le nombre d\'adultes doit être supérieur à 0'
      });
    }

    // Vérifier si la chambre est disponible
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Chambre non trouvée'
      });
    }

    if (room.status !== 'LIBRE') {
      return res.status(400).json({
        status: 'error',
        message: 'Chambre non disponible'
      });
    }

    // Vérifier les dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
      return res.status(400).json({
        status: 'error',
        message: 'La date de départ doit être postérieure à la date d\'arrivée'
      });
    }

    // Vérifier les conflits de réservation
    const conflictingReservation = await Reservation.findOne({
      where: {
        roomId,
        [Op.or]: [
          {
            checkInDate: {
              [Op.between]: [checkIn, checkOut]
            }
          },
          {
            checkOutDate: {
              [Op.between]: [checkIn, checkOut]
            }
          }
        ]
      }
    });

    if (conflictingReservation) {
      return res.status(400).json({
        status: 'error',
        message: 'La chambre est déjà réservée pour ces dates'
      });
    }

    // Calculer le prix total
    const numberOfNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = room.basePrice * numberOfNights;

    // Créer la réservation
    const reservation = await Reservation.create({
      clientName,
      clientType,
      numberOfAdults,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalPrice,
      paymentMethod,
      paymentStatus: paymentStatus || 'PENDING',
      roomId,
      createdBy: req.user.id
    });

    // Mettre à jour le statut de la chambre
    await room.update({ status: 'RESERVEE' });

    res.status(201).json({
      status: 'success',
      data: reservation
    });
  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Erreur lors de la création de la réservation'
    });
  }
};

// Obtenir toutes les réservations
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.findAll({
      include: [
        {
          model: Room,
          attributes: ['number', 'type', 'status']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['username', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      status: 'success',
      data: reservations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des réservations'
    });
  }
};

// Obtenir une réservation par ID
exports.getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByPk(id, {
      include: [{
        model: Room,
        attributes: ['number', 'type']
      }]
    });

    if (!reservation) {
      return res.status(404).json({
        status: 'error',
        message: 'Réservation non trouvée'
      });
    }

    res.json({
      status: 'success',
      data: reservation
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération de la réservation'
    });
  }
};

// Mettre à jour le statut de paiement
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const reservation = await Reservation.findByPk(id);
    if (!reservation) {
      return res.status(404).json({
        status: 'error',
        message: 'Réservation non trouvée'
      });
    }

    await reservation.update({ paymentStatus });

    res.json({
      status: 'success',
      data: reservation
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de paiement:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la mise à jour du statut de paiement'
    });
  }
}; 