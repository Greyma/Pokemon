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
  nombreAdultes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  nombreEnfants: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
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
  },
  suppléments: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Liste des suppléments sélectionnés avec leurs prix et quantités',
    get() {
      const rawValue = this.getDataValue('suppléments');
      return rawValue ? JSON.parse(JSON.stringify(rawValue)) : [];
    },
    set(value) {
      this.setDataValue('suppléments', value);
    }
  },
  activites: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Liste des activités sélectionnées avec leurs prix et quantités',
    get() {
      const rawValue = this.getDataValue('activites');
      return rawValue ? JSON.parse(JSON.stringify(rawValue)) : [];
    },
    set(value) {
      this.setDataValue('activites', value);
    }
  },
  remise: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Informations sur la remise appliquée',
    get() {
      const rawValue = this.getDataValue('remise');
      return rawValue ? JSON.parse(JSON.stringify(rawValue)) : null;
    },
    set(value) {
      this.setDataValue('remise', value);
    }
  },
  montantRemise: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Montant de la remise calculée'
  },
  montantPaye: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Montant déjà payé'
  },
  methodePaiement: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Méthode de paiement principale'
  },
  typeReservation: {
    type: DataTypes.ENUM('standard', 'convention'),
    allowNull: false,
    defaultValue: 'standard'
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