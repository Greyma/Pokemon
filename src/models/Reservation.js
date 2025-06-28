const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const Reservation = sequelize.define('Reservation', {
  reservationId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  nomClient: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  adresse: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dateEntree: {
    type: DataTypes.DATE,
    allowNull: false
  },
  dateSortie: {
    type: DataTypes.DATE,
    allowNull: false
  },
  dateEntreeReelle: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date réelle d\'entrée du client'
  },
  dateSortieReelle: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date réelle de sortie du client'
  },
  nombrePersonnes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  chambreId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  numeroChambre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  typeChambre: {
    type: DataTypes.ENUM('STANDARD', 'VIP', 'SUITE'),
    allowNull: false
  },
  montantTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paiements: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('paiements');
      return rawValue ? JSON.parse(JSON.stringify(rawValue)) : [];
    },
    set(value) {
      this.setDataValue('paiements', value);
    }
  },
  preuvePaiement: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Chemin vers le fichier PDF de la preuve de paiement'
  },
  nomGarant: {
    type: DataTypes.STRING,
    allowNull: true
  },
  remarques: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  receptionnisteId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM('validee', 'en_cours', 'terminee', 'annulee'),
    allowNull: false,
    defaultValue: 'validee'
  },
  dateCreation: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  receptionniste: {
    type: DataTypes.STRING,
    allowNull: false
  },
  conventionId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID de la convention si cette réservation est liée à une convention'
  }
}, {
  timestamps: true,
  validate: {
    checkDates() {
      if (this.dateEntree >= this.dateSortie) {
        throw new Error('La date de départ doit être postérieure à la date d\'arrivée');
      }
      if (this.dateEntreeReelle && this.dateSortieReelle && this.dateEntreeReelle >= this.dateSortieReelle) {
        throw new Error('La date de sortie réelle doit être postérieure à la date d\'entrée réelle');
      }
    }
  }
});

module.exports = Reservation; 