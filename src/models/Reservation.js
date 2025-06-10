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
    allowNull: false,
    validate: {
      min: 1
    }
  },
  numberOfChildren: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
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
    type: DataTypes.ENUM('CASH', 'CREDIT_CARD', 'BANK_TRANSFER'),
    allowNull: false
  },
  paymentStatus: {
    type: DataTypes.ENUM('PENDING', 'DEPOSIT_PAID', 'PAID', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  specialRequests: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  guaranteedBy: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'username'
    }
  },
  depositAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
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
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  invoiceUrl: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true,
  validate: {
    checkDates() {
      if (this.checkInDate >= this.checkOutDate) {
        throw new Error('La date de départ doit être postérieure à la date d\'arrivée');
      }
    }
  }
});

module.exports = Reservation; 