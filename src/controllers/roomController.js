const { Room } = require('../models');
const { Op } = require('sequelize');

// Mapping des statuts
const STATUS_MAPPING = {
  'LIBRE': 'LIBRE',
  'RÉSERVÉE': 'RESERVEE',
  'OCCUPÉE': 'OCCUPEE'
};

const REVERSE_STATUS_MAPPING = {
  'LIBRE': 'LIBRE',
  'RESERVEE': 'RÉSERVÉE',
  'OCCUPEE': 'OCCUPÉE'
};

// Créer une nouvelle chambre
exports.createRoom = async (req, res) => {
  try {
    const {
      number,
      type,
      pricePerAdult,
      description,
      capacity,
      amenities
    } = req.body;

    // Validation des données requises
    if (!number || !type || !pricePerAdult || !capacity) {
      return res.status(400).json({
        status: 'error',
        message: 'Données de chambre incomplètes'
      });
    }

    // Validation du type de chambre
    const validTypes = ['STANDARD', 'VIP', 'SUITE'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        status: 'error',
        message: 'Type de chambre invalide'
      });
    }

    // Vérifier si le numéro de chambre existe déjà
    const existingRoom = await Room.findOne({ where: { number } });
    if (existingRoom) {
      return res.status(400).json({
        status: 'error',
        message: 'Ce numéro de chambre existe déjà'
      });
    }

    // Validation du prix par adulte
    if (pricePerAdult < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Le prix par adulte doit être positif'
      });
    }

    // Validation de la capacité
    if (capacity < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'La capacité doit être supérieure à 0'
      });
    }

    // Créer la chambre
    const room = await Room.create({
      number,
      type,
      pricePerAdult,
      description,
      capacity,
      amenities: amenities || [],
      status: 'LIBRE'
    });

    res.status(201).json({
      status: 'success',
      data: room
    });
  } catch (error) {
    console.error('Erreur lors de la création de la chambre:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Erreur lors de la création de la chambre'
    });
  }
};

// Obtenir toutes les chambres
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      where: { isActive: true },
      order: [['number', 'ASC']]
    });

    res.json({
      status: 'success',
      data: rooms
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des chambres:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des chambres'
    });
  }
};

// Obtenir les chambres disponibles
exports.getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      where: {
        status: 'LIBRE',
        isActive: true
      },
      order: [['number', 'ASC']]
    });

    res.json({
      status: 'success',
      data: rooms
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des chambres disponibles:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des chambres disponibles'
    });
  }
};

// Mettre à jour une chambre
exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      pricePerAdult,
      description,
      capacity,
      amenities,
      isActive
    } = req.body;

    const room = await Room.findByPk(id);
    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Chambre non trouvée'
      });
    }

    // Validation du prix par adulte si fourni
    if (pricePerAdult !== undefined && pricePerAdult < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Le prix par adulte doit être positif'
      });
    }

    // Validation de la capacité si fournie
    if (capacity !== undefined && capacity < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'La capacité doit être supérieure à 0'
      });
    }

    await room.update({
      pricePerAdult,
      description,
      capacity,
      amenities,
      isActive
    });

    res.json({
      status: 'success',
      data: room
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la chambre:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Erreur lors de la mise à jour de la chambre'
    });
  }
};

// Libérer une chambre
exports.releaseRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findByPk(id);
    
    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Chambre non trouvée'
      });
    }

    await room.update({ status: 'LIBRE' });
    res.json({
      status: 'success',
      message: 'Chambre libérée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la libération de la chambre:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la libération de la chambre'
    });
  }
};

// Mettre à jour le statut d'une chambre
exports.updateRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const room = await Room.findByPk(id);
    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Chambre non trouvée'
      });
    }

    // Validation du statut
    const validStatuses = ['LIBRE', 'RÉSERVÉE', 'OCCUPÉE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Statut invalide'
      });
    }

    await room.update({ status });

    res.json({
      status: 'success',
      data: room
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Erreur lors de la mise à jour du statut'
    });
  }
}; 