const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  clientType: {
    type: DataTypes.ENUM('PRESENTIEL', 'ONLINE'),
    allowNull: false
  },
  numberOfAdults: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  checkInDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  checkOutDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('CASH', 'CCP'),
    allowNull: false
  },
  paymentStatus: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  ccpProofPath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  roomId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = Reservation; 