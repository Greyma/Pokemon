const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ConventionRoom = sequelize.define('ConventionRoom', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  conventionId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['conventionId', 'roomId']
    }
  ]
});

module.exports = ConventionRoom; 