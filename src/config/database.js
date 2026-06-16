const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// En mode standalone, la base est à la racine du projet.
// En mode application Electron, DATABASE_PATH pointe vers un emplacement
// inscriptible (userData), car les ressources packagées sont en lecture seule.
const storage = process.env.DATABASE_PATH
  ? process.env.DATABASE_PATH
  : path.join(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

module.exports = {
  sequelize,
  jwtSecret: process.env.JWT_SECRET || 'votre_cle_secrete_jwt_tres_longue_et_complexe_2025',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
};