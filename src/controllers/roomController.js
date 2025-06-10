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
      capacity,
      basePrice,
      extraPersonPrice,
      description
    } = req.body;

    // Validation des données requises
    if (!number || !type || !capacity || !basePrice) {
      return res.status(400).json({
        success: false,
        message: 'Données de chambre incomplètes'
      });
    }

    // Validation du type de chambre
    const validTypes = ['STANDARD', 'VIP', 'SUITE'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type de chambre invalide'
      });
    }

    // Validation des prix
    if (basePrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Le prix de base ne peut pas être négatif'
      });
    }

    if (extraPersonPrice && extraPersonPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Le prix par personne supplémentaire ne peut pas être négatif'
      });
    }

    // Vérifier si le numéro de chambre existe déjà
    const existingRoom = await Room.findOne({ where: { number } });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: 'Ce numéro de chambre existe déjà'
      });
    }

    // Créer la chambre
    const room = await Room.create({
      number,
      type,
      capacity,
      basePrice,
      extraPersonPrice: extraPersonPrice || 0,
      description,
      status: 'LIBRE',
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Erreur lors de la création de la chambre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la chambre'
    });
  }
};

// Obtenir toutes les chambres
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      order: [['number', 'ASC']]
    });

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des chambres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des chambres'
    });
  }
};

// Obtenir une chambre par ID
exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findByPk(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la chambre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la chambre'
    });
  }
};

// Mettre à jour une chambre
exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      capacity,
      basePrice,
      extraPersonPrice,
      description
    } = req.body;

    const room = await Room.findByPk(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }

    // Validation du type de chambre
    if (type && !['STANDARD', 'VIP', 'SUITE'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type de chambre invalide'
      });
    }

    // Validation des prix
    if (basePrice !== undefined && basePrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Le prix de base ne peut pas être négatif'
      });
    }

    if (extraPersonPrice !== undefined && extraPersonPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Le prix par personne supplémentaire ne peut pas être négatif'
      });
    }

    // Mettre à jour la chambre
    await room.update({
      type: type || room.type,
      capacity: capacity || room.capacity,
      basePrice: basePrice || room.basePrice,
      extraPersonPrice: extraPersonPrice !== undefined ? extraPersonPrice : room.extraPersonPrice,
      description: description || room.description
    });

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la chambre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la chambre'
    });
  }
};

// Mettre à jour le statut d'une chambre
exports.updateRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isActive } = req.body;

    const room = await Room.findByPk(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }

    // Validation du statut
    const validStatuses = ['LIBRE', 'RÉSERVÉE', 'OCCUPÉE', 'MAINTENANCE'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut de chambre invalide'
      });
    }

    // Mettre à jour le statut
    const updates = {};
    if (status) updates.status = status;
    if (isActive !== undefined) updates.isActive = isActive;

    await room.update(updates);

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la chambre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut de la chambre'
    });
  }
};

// Obtenir les chambres disponibles
exports.getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      where: {
        isActive: true,
        status: 'LIBRE'
      },
      order: [['number', 'ASC']]
    });

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des chambres disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des chambres disponibles'
    });
  }
};

// Obtenir une chambre par son numéro
exports.getRoomByNumber = async (req, res) => {
  try {
    const { number } = req.params;
    const room = await Room.findOne({ where: { number } });

    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Chambre non trouvée'
      });
    }

    res.json({
      status: 'success',
      data: room
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la chambre:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération de la chambre'
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
        success: false,
        message: 'Chambre non trouvée'
      });
    }

    // Vérifier si la chambre est déjà libre
    if (room.status === 'LIBRE') {
      return res.status(400).json({
        success: false,
        message: 'La chambre est déjà libre'
      });
    }

    // Libérer la chambre
    await room.update({
      status: 'LIBRE'
    });

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Erreur lors de la libération de la chambre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la libération de la chambre'
    });
  }
}; 