const { User } = require('../models');
const { Op } = require('sequelize');

// Créer un nouvel utilisateur
exports.createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validation des données requises
    if (!username || !password || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Données utilisateur incomplètes'
      });
    }

    // Validation du rôle
    if (!['MANAGER', 'RECEPTIONIST'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Rôle utilisateur invalide'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Ce nom d\'utilisateur existe déjà'
      });
    }

    const user = await User.create({
      username,
      password,
      role
    });

    return res.status(201).json({
      status: 'success',
      data: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    
    // Gestion spécifique des erreurs de contrainte unique
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        status: 'error',
        message: 'Ce nom d\'utilisateur existe déjà'
      });
    }

    // Pour toute autre erreur
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la création de l\'utilisateur'
    });
  }
};

// Obtenir tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'isActive', 'lastLogin', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      status: 'success',
      data: users
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
};

// Obtenir les statistiques des utilisateurs
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const managers = await User.count({ where: { role: 'MANAGER' } });
    const receptionists = await User.count({ where: { role: 'RECEPTIONIST' } });

    return res.json({
      status: 'success',
      data: {
        totalUsers,
        activeUsers,
        managers,
        receptionists
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
}; 