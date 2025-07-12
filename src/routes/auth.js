const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { jwtSecret, jwtExpiration } = require('../config/database');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validation des données requises
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Nom d\'utilisateur et mot de passe requis'
      });
    }

    const user = await User.findOne({ where: { username } });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Nom d\'utilisateur ou mot de passe incorrect'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Compte désactivé'
      });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        username: user.username,
        isActive: user.isActive
      },
      jwtSecret,
      { expiresIn: jwtExpiration }
    );

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // Retourner toutes les informations de l'utilisateur (sauf le mot de passe)
    const userResponse = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin
    };

    res.json({
      status: 'success',
      message: 'Connexion réussie',
      data: {
        token,
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la connexion'
    });
  }
});

// Vérifier le token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

module.exports = router; 