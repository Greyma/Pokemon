const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
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
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    user.lastLogin = new Date();
    await user.save();

    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
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