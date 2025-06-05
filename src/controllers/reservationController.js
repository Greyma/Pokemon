const { Reservation, Room, User } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;

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

    // Vérifier la capacité de la chambre
    if (numberOfAdults > room.capacity) {
      return res.status(400).json({
        status: 'error',
        message: `Cette chambre ne peut accueillir que ${room.capacity} personnes maximum`
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
    const totalPrice = room.pricePerAdult * numberOfAdults * numberOfNights;

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
    await room.update({ status: 'RÉSERVÉE' });

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

// Calculer le prix d'une réservation
exports.calculatePrice = async (req, res) => {
  try {
    const {
      checkInDate,
      checkOutDate,
      roomType,
      numberOfAdults
    } = req.body;

    // Validation des données requises
    if (!checkInDate || !checkOutDate || !roomType || !numberOfAdults) {
      return res.status(400).json({
        status: 'error',
        message: 'Données incomplètes pour le calcul du prix'
      });
    }

    // Validation du nombre d'adultes
    if (numberOfAdults <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Le nombre d\'adultes doit être supérieur à 0'
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

    // Trouver une chambre du type demandé
    const room = await Room.findOne({
      where: {
        type: roomType,
        isActive: true
      }
    });

    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Aucune chambre de ce type n\'est disponible'
      });
    }

    // Vérifier la capacité de la chambre
    if (numberOfAdults > room.capacity) {
      return res.status(400).json({
        status: 'error',
        message: `Cette chambre ne peut accueillir que ${room.capacity} personnes maximum`
      });
    }

    // Calculer le nombre de nuits
    const numberOfNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    // Calculer le prix total
    const pricePerAdult = room.pricePerAdult;
    const totalPrice = pricePerAdult * numberOfAdults * numberOfNights;

    res.json({
      status: 'success',
      data: {
        totalPrice,
        numberOfNights,
        pricePerAdult,
        roomType: room.type,
        numberOfAdults,
        capacity: room.capacity
      }
    });
  } catch (error) {
    console.error('Erreur lors du calcul du prix:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du calcul du prix'
    });
  }
};

// Gérer le paiement d'un acompte
exports.handleDeposit = async (req, res) => {
  try {
    const {
      clientName,
      clientType,
      numberOfAdults,
      checkInDate,
      checkOutDate,
      paymentMethod,
      depositAmount,
      roomType
    } = req.body;

    // Validation des données requises
    if (!clientName || !clientType || !numberOfAdults || !checkInDate || !checkOutDate || !paymentMethod || !depositAmount || !roomType) {
      return res.status(400).json({
        status: 'error',
        message: 'Données incomplètes pour le paiement de l\'acompte'
      });
    }

    // Validation du montant de l'acompte
    if (depositAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Le montant de l\'acompte doit être positif'
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

    // Trouver une chambre du type demandé
    const room = await Room.findOne({
      where: {
        type: roomType,
        isActive: true
      }
    });

    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Aucune chambre de ce type n\'est disponible'
      });
    }

    // Vérifier la capacité de la chambre
    if (numberOfAdults > room.capacity) {
      return res.status(400).json({
        status: 'error',
        message: `Cette chambre ne peut accueillir que ${room.capacity} personnes maximum`
      });
    }

    // Calculer le prix total
    const numberOfNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = room.pricePerAdult * numberOfAdults * numberOfNights;

    // Vérifier que l'acompte est suffisant (au moins 30% du prix total)
    const minimumDeposit = totalPrice * 0.3;
    if (depositAmount < minimumDeposit) {
      return res.status(400).json({
        status: 'error',
        message: `L'acompte minimum doit être de ${minimumDeposit} (30% du prix total)`
      });
    }

    // Créer la réservation avec l'acompte
    const reservation = await Reservation.create({
      clientName,
      clientType,
      numberOfAdults,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalPrice,
      paymentMethod,
      paymentStatus: 'PENDING',
      depositAmount,
      roomId: room.id,
      createdBy: req.user.id
    });

    // Mettre à jour le statut de la chambre
    await room.update({ status: 'RÉSERVÉE' });

    res.status(201).json({
      status: 'success',
      data: {
        reservation,
        totalPrice,
        depositAmount,
        remainingAmount: totalPrice - depositAmount
      }
    });
  } catch (error) {
    console.error('Erreur lors du paiement de l\'acompte:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Erreur lors du paiement de l\'acompte'
    });
  }
};

// Upload du justificatif CCP
exports.uploadPdf = async (req, res) => {
  try {
    const { reservationId } = req.body;
    const file = req.files.file;

    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'Aucun fichier n\'a été uploadé'
      });
    }

    if (!reservationId) {
      return res.status(400).json({
        status: 'error',
        message: 'ID de réservation manquant'
      });
    }

    // Vérifier que la réservation existe
    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) {
      return res.status(404).json({
        status: 'error',
        message: 'Réservation non trouvée'
      });
    }

    // Créer le dossier uploads s'il n'existe pas
    const uploadDir = path.join(__dirname, '../uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    // Générer un nom de fichier unique
    const fileName = `${reservationId}-${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    // Sauvegarder le fichier
    await file.mv(filePath);

    // Mettre à jour le chemin du fichier dans la réservation
    await reservation.update({
      ccpProofPath: fileName
    });

    res.json({
      status: 'success',
      data: {
        message: 'Fichier uploadé avec succès',
        fileName
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload du PDF:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'upload du PDF'
    });
  }
}; 