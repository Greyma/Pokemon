const jwt = require('jsonwebtoken');
const config = require('../config/database');

// Middleware pour vérifier le token JWT
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Vérifie que l'en-tête Authorization existe et commence par 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'En-tête Authorization manquant ou mal formé'
    });
  }
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token d\'authentification manquant'
    });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }
    req.user = user;
    next();
  });
};

// Middleware pour vérifier si l'utilisateur est un manager
exports.isManager = (req, res, next) => {
  if (req.user && req.user.role === 'MANAGER') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Accès refusé. Droits de manager requis.'
  });
};

// Middleware pour vérifier si l'utilisateur est un réceptionniste
exports.isReceptionist = (req, res, next) => {
  if (req.user && req.user.role === 'RECEPTIONIST') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Accès refusé. Droits de réceptionniste requis.'
  });
};

// Middleware pour vérifier si l'utilisateur a le rôle requis
exports.hasRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    if (roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Rôle non autorisé.'
    });
  };
};

// Middleware pour valider l'utilisateur depuis le token
exports.validateUserFromToken = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Utilisateur non authentifié'
    });
  }

  // Vérifier que l'utilisateur a un ID valide
  if (!req.user.id) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide : ID utilisateur manquant'
    });
  }

  // Vérifier que l'utilisateur est actif
  if (req.user.isActive === false) {
    return res.status(403).json({
      success: false,
      message: 'Compte utilisateur désactivé'
    });
  }

  // Vérifier que l'utilisateur a un rôle valide
  if (!req.user.role || !['MANAGER', 'RECEPTIONIST', 'COMPTABLE'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Rôle utilisateur invalide'
    });
  }

  next();
};

// Middleware pour vérifier que l'utilisateur est un manager
exports.requireManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Utilisateur non authentifié'
    });
  }

  if (req.user.role !== 'MANAGER') {
    return res.status(403).json({
      success: false,
      message: 'Droits de manager requis'
    });
  }

  if (req.user.isActive === false) {
    return res.status(403).json({
      success: false,
      message: 'Compte utilisateur désactivé'
    });
  }

  next();
};
