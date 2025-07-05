const { Model, DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

class Supplement extends Model {}

Supplement.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  prix: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Supplement',
  tableName: 'supplements',
  timestamps: true,
  validate: {
    validatePrix() {
      if (this.prix < 0) {
        throw new Error('Le prix du supplément doit être positif');
      }
    }
  }
});

module.exports = Supplement; 