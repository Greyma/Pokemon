const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const reservationRoutes = require('./routes/reservations');
const userRoutes = require('./routes/users');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Une erreur est survenue'
  });
});

const PORT = process.env.PORT || 3000;

// Database connection and server start
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données établie avec succès.');
    
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Modèles synchronisés avec la base de données.');

    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('Impossible de démarrer le serveur:', error);
  }
}

startServer(); 