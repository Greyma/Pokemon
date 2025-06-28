const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

module.exports = {
  sequelize,
  jwtSecret: process.env.JWT_SECRET || 'votre_cle_secrete_jwt_tres_longue_et_complexe_2025',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
};