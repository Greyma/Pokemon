const { Room } = require('../models');
const { Op } = require('sequelize');

// Créer une nouvelle chambre
exports.createRoom = async (req, res) => {
  try {
    const { number, type, basePrice } = req.body;

    // Validation des données requises
    if (!number || !type || basePrice === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Données de chambre incomplètes'
      });
    }

    // Validation du prix
    if (basePrice <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Le prix de base doit être positif'
      });
    }

    // Validation du type de chambre
    if (!['STANDARD', 'VIP', 'SUITE'].includes(type)) {
      return res.status(400).json({
        status: 'error',
        message: 'Type de chambre invalide'
      });
    }

    // Vérifier si la chambre existe déjà
    const existingRoom = await Room.findOne({ where: { number } });
    if (existingRoom) {
      return res.status(400).json({
        status: 'error',
        message: 'Ce numéro de chambre existe déjà'
      });
    }

    const room = await Room.create({
      number,
      type,
      basePrice,
      status: 'LIBRE',
      isActive: true
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
      where: { isActive: true }
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
      }
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
    const { basePrice, status, isActive } = req.body;

    const room = await Room.findByPk(id);
    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Chambre non trouvée'
      });
    }

    await room.update({
      basePrice: basePrice || room.basePrice,
      status: status || room.status,
      isActive: isActive !== undefined ? isActive : room.isActive
    });

    res.json({
      status: 'success',
      data: room
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la chambre:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la mise à jour de la chambre'
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