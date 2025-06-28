const express = require('express');
const cors = require('cors');
const {sequelize} = require('./config/database');
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/roomRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const userRoutes = require('./routes/users');
const statisticsRoutes = require('./routes/statisticsRoutes');
const employeeTrackingRoutes = require('./routes/employeeTrackingRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const activityRoutes = require('./routes/activityRoutes');
const financeRoutes = require('./routes/financeRoutes');
const conventionRoutes = require('./routes/conventionRoutes');
const path = require('path');
const fileUpload = require('express-fileupload');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration de express-file-upload uniquement pour les routes d'upload
app.use('/api/reservations/upload-ccp', fileUpload({
  debug: true,
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  abortOnLimit: true,
  responseOnLimit: 'Fichier trop volumineux',
  safeFileNames: true,
  preserveExtension: true,
  handleErrors: true,
  checkFileType: false
}));

// Middleware de débogage pour les requêtes
app.use((req, res, next) => {
  console.log('📝 Requête reçue:', {
    method: req.method,
    path: req.path,
    contentType: req.headers['content-type'],
    hasFiles: !!req.files,
    body: req.body,
    headers: req.headers
  });
  next();
});
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/employee-tracking', employeeTrackingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/conventions', conventionRoutes);

// Servir les fichiers statiques du dossier public
app.use(express.static(path.join(__dirname, '../public')));

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    path: req.path,
    method: req.method,
    body: req.body,
    files: req.files ? Object.keys(req.files) : 'Aucun fichier'
  });

  // Déterminer le type d'erreur
  let statusCode = err.statusCode || 500;
  let errorMessage = err.message || 'Une erreur est survenue';
  let errorDetails = {};

  // Gestion des erreurs spécifiques
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    errorMessage = 'Erreur de validation des données';
    errorDetails = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    errorMessage = 'Conflit de données';
    errorDetails = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorMessage = 'Token invalide';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorMessage = 'Token expiré';
  }

  // Envoi de la réponse d'erreur
  res.status(statusCode).json({
    status: 'error',
    message: errorMessage,
    details: errorDetails,
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route non trouvée',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;

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

// Export l'application pour les tests
module.exports = app;

// Démarrer le serveur seulement si ce fichier est exécuté directement
if (require.main === module) {
  startServer();
} 