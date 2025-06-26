const { Convention, User } = require('../models');
const { sequelize } = require('../config/database');
const path = require('path');
const fs = require('fs');

class ConventionService {
  // Récupérer toutes les conventions avec filtres
  static async getAllConventions(filters = {}) {
    const { page = 1, limit = 10, search, statut, dateDebut, dateFin } = filters;
    const offset = (page - 1) * limit;

    // Construire les conditions de recherche
    const whereClause = {};
    
    if (search) {
      whereClause[sequelize.Op.or] = [
        { numeroConvention: { [sequelize.Op.iLike]: `%${search}%` } },
        { nomSociete: { [sequelize.Op.iLike]: `%${search}%` } },
        { contactPrincipal: { [sequelize.Op.iLike]: `%${search}%` } }
      ];
    }

    if (statut) {
      whereClause.statut = statut;
    }

    if (dateDebut && dateFin) {
      whereClause.dateDebut = { [sequelize.Op.gte]: dateDebut };
      whereClause.dateFin = { [sequelize.Op.lte]: dateFin };
    }

    return await Convention.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'role']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  }

  // Récupérer une convention par ID
  static async getConventionById(id) {
    return await Convention.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'role']
        }
      ]
    });
  }

  // Vérifier si un numéro de convention existe déjà
  static async checkConventionNumberExists(numeroConvention, excludeId = null) {
    const whereClause = { numeroConvention };
    
    if (excludeId) {
      whereClause.id = { [sequelize.Op.ne]: excludeId };
    }

    return await Convention.findOne({ where: whereClause });
  }

  // Valider les dates de convention
  static validateConventionDates(dateDebut, dateFin) {
    if (new Date(dateFin) <= new Date(dateDebut)) {
      throw new Error('La date de fin doit être postérieure à la date de début');
    }
  }

  // Créer une nouvelle convention
  static async createConvention(conventionData, createdBy) {
    // Vérifier si le numéro de convention existe déjà
    const existingConvention = await this.checkConventionNumberExists(conventionData.numeroConvention);
    if (existingConvention) {
      throw new Error('Un numéro de convention avec ce numéro existe déjà');
    }

    // Valider les dates
    this.validateConventionDates(conventionData.dateDebut, conventionData.dateFin);

    const convention = await Convention.create({
      ...conventionData,
      createdBy
    });

    return await this.getConventionById(convention.id);
  }

  // Mettre à jour une convention
  static async updateConvention(id, updateData) {
    const convention = await Convention.findByPk(id);
    
    if (!convention) {
      throw new Error('Convention non trouvée');
    }

    // Vérifier si le numéro de convention existe déjà (sauf pour cette convention)
    if (updateData.numeroConvention && updateData.numeroConvention !== convention.numeroConvention) {
      const existingConvention = await this.checkConventionNumberExists(updateData.numeroConvention, id);
      if (existingConvention) {
        throw new Error('Un numéro de convention avec ce numéro existe déjà');
      }
    }

    // Valider les dates si elles sont fournies
    if (updateData.dateDebut && updateData.dateFin) {
      this.validateConventionDates(updateData.dateDebut, updateData.dateFin);
    }

    await convention.update(updateData);

    return await this.getConventionById(convention.id);
  }

  // Supprimer une convention
  static async deleteConvention(id) {
    const convention = await Convention.findByPk(id);
    
    if (!convention) {
      throw new Error('Convention non trouvée');
    }

    // Supprimer le fichier justificatif s'il existe
    if (convention.justificatifPath) {
      const filePath = path.join(__dirname, '../../public/uploads/conventions', convention.justificatifPath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await convention.destroy();
    return true;
  }

  // Gérer l'upload de justificatif
  static async uploadJustificatif(id, file) {
    const convention = await Convention.findByPk(id);
    
    if (!convention) {
      throw new Error('Convention non trouvée');
    }

    // Créer le dossier d'upload s'il n'existe pas
    const uploadDir = path.join(__dirname, '../../public/uploads/conventions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const fileExtension = path.extname(file.name);
    const fileName = `convention_${convention.id}_${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Supprimer l'ancien fichier s'il existe
    if (convention.justificatifPath) {
      const oldFilePath = path.join(uploadDir, convention.justificatifPath);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Déplacer le nouveau fichier
    await file.mv(filePath);

    // Mettre à jour la convention
    await convention.update({
      justificatifPath: fileName
    });

    return {
      fileName: fileName,
      filePath: `/uploads/conventions/${fileName}`
    };
  }

  // Obtenir le chemin du justificatif
  static async getJustificatifPath(id) {
    const convention = await Convention.findByPk(id);
    
    if (!convention) {
      throw new Error('Convention non trouvée');
    }

    if (!convention.justificatifPath) {
      throw new Error('Aucun justificatif trouvé pour cette convention');
    }

    const filePath = path.join(__dirname, '../../public/uploads/conventions', convention.justificatifPath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('Fichier justificatif introuvable');
    }

    return filePath;
  }

  // Obtenir les statistiques des conventions
  static async getConventionStats() {
    const totalConventions = await Convention.count();
    const activeConventions = await Convention.count({ where: { statut: 'ACTIVE' } });
    const inactiveConventions = await Convention.count({ where: { statut: 'INACTIVE' } });
    const expiredConventions = await Convention.count({ where: { statut: 'EXPIRED' } });

    // Conventions expirant dans les 30 prochains jours
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSoon = await Convention.count({
      where: {
        dateFin: {
          [sequelize.Op.lte]: thirtyDaysFromNow,
          [sequelize.Op.gte]: new Date()
        },
        statut: 'ACTIVE'
      }
    });

    return {
      total: totalConventions,
      active: activeConventions,
      inactive: inactiveConventions,
      expired: expiredConventions,
      expiringSoon: expiringSoon
    };
  }

  // Rechercher des conventions par société
  static async searchConventionsBySociete(nomSociete) {
    return await Convention.findAll({
      where: {
        nomSociete: { [sequelize.Op.iLike]: `%${nomSociete}%` }
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  // Obtenir les conventions actives
  static async getActiveConventions() {
    return await Convention.findAll({
      where: { statut: 'ACTIVE' },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = ConventionService; 