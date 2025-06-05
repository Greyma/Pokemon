const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Room extends Model {}

Room.init({
  number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('STANDARD', 'VIP', 'SUITE'),
    allowNull: false
  },
  pricePerAdult: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('LIBRE', 'RÉSERVÉE', 'OCCUPÉE'),
    defaultValue: 'LIBRE'
  },
  description: {
    type: DataTypes.TEXT
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  amenities: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Room'
});

module.exports = Room; 