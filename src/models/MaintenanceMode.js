const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const MaintenanceMode = sequelize.define('MaintenanceMode', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = MaintenanceMode; 