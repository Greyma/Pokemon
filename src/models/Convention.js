const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const Convention = sequelize.define('Convention', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  numeroConvention: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  nomSociete: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  nombreJours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 365
    }
  },
  prixConvention: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  // Configuration des chambres par type pour sélection automatique
  chambresStandard: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 50
    }
  },
  chambresVIP: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 20
    }
  },
  chambresSuite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 10
    }
  },
  nombreAdultesMaxParChambre: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 4
    }
  },
  justificatifPath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Champs supplémentaires suggérés
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contactPrincipal: {
    type: DataTypes.STRING,
    allowNull: true
  },
  conditionsSpeciales: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description détaillée de la convention, objectifs, participants, etc.'
  },
  statut: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'EXPIRED'),
    defaultValue: 'ACTIVE'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Statut de réservation automatique
  reservationAutomatique: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reservationsCreees: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['numeroConvention']
    },
    {
      fields: ['nomSociete']
    },
    {
      fields: ['dateDebut', 'dateFin']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['reservationAutomatique']
    }
  ],
  hooks: {
    beforeValidate: (convention) => {
      // Calculer le nombre total de chambres
      convention.nombreChambres = (convention.chambresStandard || 0) + 
                                 (convention.chambresVIP || 0) + 
                                 (convention.chambresSuite || 0);
    }
  }
});

// Méthode pour obtenir le nombre total de chambres
Convention.prototype.getNombreTotalChambres = function() {
  return (this.chambresStandard || 0) + (this.chambresVIP || 0) + (this.chambresSuite || 0);
};

// Méthode pour obtenir la configuration des chambres
Convention.prototype.getConfigurationChambres = function() {
  return {
    STANDARD: this.chambresStandard || 0,
    VIP: this.chambresVIP || 0,
    SUITE: this.chambresSuite || 0,
    total: this.getNombreTotalChambres()
  };
};

module.exports = Convention; 