const { Convention, User, Room, ConventionRoom, Reservation } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
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
      whereClause[Op.or] = [
        { numeroConvention: { [Op.like]: `%${search}%` } },
        { nomSociete: { [Op.like]: `%${search}%` } },
        { contactPrincipal: { [Op.like]: `%${search}%` } }
      ];
    }

    if (statut) {
      whereClause.statut = statut;
    }

    if (dateDebut && dateFin) {
      whereClause.dateDebut = { [Op.gte]: dateDebut };
      whereClause.dateFin = { [Op.lte]: dateFin };
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
        },
        {
          model: Room,
          as: 'rooms',
          through: { attributes: [] }
        }
      ]
    });
  }

  // Vérifier si un numéro de convention existe déjà
  static async checkConventionNumberExists(numeroConvention, excludeId = null) {
    const whereClause = { numeroConvention };
    
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
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

    // Vérifier la présence du nombre de jours
    if (!conventionData.nombreJours) {
      throw new Error('Le nombre de jours est requis');
    }

    // Vérifier qu'au moins une chambre est configurée
    const configChambres = {
      STANDARD: conventionData.chambresStandard || 0,
      VIP: conventionData.chambresVIP || 0,
      SUITE: conventionData.chambresSuite || 0
    };
    
    const totalChambres = configChambres.STANDARD + configChambres.VIP + configChambres.SUITE;
    if (totalChambres === 0) {
      throw new Error('Au moins une chambre doit être configurée pour la convention');
    }

    // Calculer la date de fin
    const dateDebut = new Date(conventionData.dateDebut);
    const dateFin = new Date(dateDebut);
    dateFin.setDate(dateDebut.getDate() + conventionData.nombreJours - 1);

    // Créer la convention
    const convention = await Convention.create({
      ...conventionData,
      dateFin: dateFin.toISOString().split('T')[0],
      createdBy
    });

    // Attribuer automatiquement les chambres disponibles
    const roomSelection = await this.selectAvailableRooms(configChambres, dateDebut, dateFin.toISOString().split('T')[0]);
    
    if (!roomSelection.success) {
      // Supprimer la convention si on ne peut pas attribuer les chambres
      await convention.destroy();
      throw new Error(roomSelection.message);
    }

    // Associer les chambres sélectionnées à la convention
    if (roomSelection.rooms.length > 0) {
      const roomIds = roomSelection.rooms.map(room => room.id);
      await convention.addRooms(roomIds);
    }

    return await this.getConventionById(convention.id);
  }

  // Sélectionner automatiquement les chambres disponibles
  static async selectAvailableRooms(configChambres, dateDebut, dateFin) {
    console.log('🔍 Debug selectAvailableRooms:');
    console.log('Config chambres:', configChambres);
    console.log('Date début:', dateDebut);
    console.log('Date fin:', dateFin);

    // Récupérer toutes les chambres disponibles par type
    const allRooms = await Room.findAll({
      where: {
        isActive: true
      },
      order: [['type', 'ASC'], ['number', 'ASC']]
    });

    console.log('🔍 Toutes les chambres actives:', allRooms.length);

    // Grouper les chambres par type
    const roomsByType = {
      STANDARD: allRooms.filter(room => room.type === 'STANDARD'),
      VIP: allRooms.filter(room => room.type === 'VIP'),
      SUITE: allRooms.filter(room => room.type === 'SUITE')
    };

    console.log('🔍 Chambres par type:', {
      STANDARD: roomsByType.STANDARD.length,
      VIP: roomsByType.VIP.length,
      SUITE: roomsByType.SUITE.length
    });

    // Vérifier les réservations existantes pour la période
    const existingReservations = await Reservation.findAll({
      where: {
        [Op.or]: [
          {
            dateEntree: {
              [Op.lt]: dateFin,
              [Op.gte]: dateDebut
            }
          },
          {
            dateSortie: {
              [Op.gt]: dateDebut,
              [Op.lte]: dateFin
            }
          },
          {
            dateEntree: { [Op.lte]: dateDebut },
            dateSortie: { [Op.gte]: dateFin }
          }
        ],
        statut: { [Op.ne]: 'annulee' }
      },
      attributes: ['chambreId']
    });

    const reservedRoomIds = new Set(existingReservations.map(r => r.chambreId));
    console.log('🔍 Chambres réservées:', reservedRoomIds.size);

    // Vérifier les conventions existantes pour la période
    const existingConventions = await Convention.findAll({
      where: {
        statut: 'ACTIVE',
        [Op.or]: [
          {
            dateDebut: {
              [Op.lt]: dateFin,
              [Op.gte]: dateDebut
            }
          },
          {
            dateFin: {
              [Op.gt]: dateDebut,
              [Op.lte]: dateFin
            }
          },
          {
            dateDebut: { [Op.lte]: dateDebut },
            dateFin: { [Op.gte]: dateFin }
          }
        ]
      },
      include: [
        {
          model: Room,
          as: 'rooms',
          through: { attributes: [] },
          attributes: ['id']
        }
      ]
    });

    const conventionRoomIds = new Set();
    existingConventions.forEach(conv => {
      conv.rooms.forEach(room => conventionRoomIds.add(room.id));
    });
    console.log('🔍 Chambres de conventions:', conventionRoomIds.size);

    // Filtrer les chambres disponibles par type
    const availableRoomsByType = {
      STANDARD: roomsByType.STANDARD.filter(room => 
        !reservedRoomIds.has(room.id) && !conventionRoomIds.has(room.id)
      ),
      VIP: roomsByType.VIP.filter(room => 
        !reservedRoomIds.has(room.id) && !conventionRoomIds.has(room.id)
      ),
      SUITE: roomsByType.SUITE.filter(room => 
        !reservedRoomIds.has(room.id) && !conventionRoomIds.has(room.id)
      )
    };

    console.log('🔍 Chambres disponibles par type:', {
      STANDARD: availableRoomsByType.STANDARD.length,
      VIP: availableRoomsByType.VIP.length,
      SUITE: availableRoomsByType.SUITE.length
    });

    // Vérifier si on a assez de chambres de chaque type
    const selectedRooms = [];
    const missingRooms = [];

    for (const type of ['STANDARD', 'VIP', 'SUITE']) {
      const needed = configChambres[type];
      const available = availableRoomsByType[type];
      
      if (needed > 0) {
        if (available.length < needed) {
          missingRooms.push(`${needed - available.length} chambre(s) ${type}`);
        } else {
          // Prendre les premières chambres disponibles
          selectedRooms.push(...available.slice(0, needed));
        }
      }
    }

    console.log('🔍 Chambres sélectionnées:', selectedRooms.length);
    console.log('🔍 Chambres manquantes:', missingRooms);

    if (missingRooms.length > 0) {
      return {
        success: false,
        message: `Chambres insuffisantes disponibles: ${missingRooms.join(', ')}`
      };
    }

    return {
      success: true,
      rooms: selectedRooms,
      details: {
        STANDARD: {
          needed: configChambres.STANDARD,
          selected: selectedRooms.filter(room => room.type === 'STANDARD').length
        },
        VIP: {
          needed: configChambres.VIP,
          selected: selectedRooms.filter(room => room.type === 'VIP').length
        },
        SUITE: {
          needed: configChambres.SUITE,
          selected: selectedRooms.filter(room => room.type === 'SUITE').length
        }
      }
    };
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
    if (updateData.dateDebut && updateData.nombreJours) {
      this.validateConventionDates(updateData.dateDebut, undefined);
      const dateDebut = new Date(updateData.dateDebut);
      const dateFin = new Date(dateDebut);
      dateFin.setDate(dateDebut.getDate() + updateData.nombreJours - 1);
      updateData.dateFin = dateFin.toISOString().split('T')[0];
    }

    // Si la configuration des chambres change, sélectionner de nouvelles chambres
    if (updateData.chambresStandard !== undefined || updateData.chambresVIP !== undefined || updateData.chambresSuite !== undefined) {
      const configChambres = {
        STANDARD: updateData.chambresStandard !== undefined ? updateData.chambresStandard : convention.chambresStandard,
        VIP: updateData.chambresVIP !== undefined ? updateData.chambresVIP : convention.chambresVIP,
        SUITE: updateData.chambresSuite !== undefined ? updateData.chambresSuite : convention.chambresSuite
      };

      const totalChambres = configChambres.STANDARD + configChambres.VIP + configChambres.SUITE;
      if (totalChambres === 0) {
        throw new Error('Au moins une chambre doit être configurée pour la convention');
      }

      const dateDebut = new Date(updateData.dateDebut || convention.dateDebut);
      const nombreJours = updateData.nombreJours || convention.nombreJours;
      const dateFin = new Date(dateDebut);
      dateFin.setDate(dateDebut.getDate() + nombreJours - 1);

      const selectedRooms = await this.selectAvailableRooms(configChambres, dateDebut, dateFin);
      
      if (!selectedRooms.success) {
        throw new Error(selectedRooms.message);
      }

      // Mettre à jour les chambres de la convention
      await convention.setRooms(selectedRooms.rooms.map(room => room.id));
    }

    await convention.update(updateData);

    return await this.getConventionById(convention.id);
  }

  // Vérifier la disponibilité des chambres pour une convention
  static async getUnavailableRooms(roomIds, dateDebut, dateFin, excludeConventionId = null) {
    // Vérifier les réservations existantes
    const reservations = await Room.findAll({
      where: {
        id: roomIds
      },
      include: [
        {
          model: Reservation,
          as: 'roomReservations',
          where: {
            [Op.or]: [
              {
                dateEntree: { [Op.lte]: dateFin },
                dateSortie: { [Op.gte]: dateDebut }
              }
            ],
            statut: { [Op.ne]: 'annulee' }
          },
          required: false
        },
        {
          model: Convention,
          as: 'conventions',
          through: { attributes: [] },
          where: excludeConventionId ? { id: { [Op.ne]: excludeConventionId } } : {},
          required: false
        }
      ]
    });

    // Chambres occupées par une réservation ou une autre convention
    const unavailable = [];
    for (const room of reservations) {
      // Vérifier les réservations
      if (room.roomReservations && room.roomReservations.length > 0) {
        unavailable.push(room.id);
        continue;
      }
      // Vérifier les conventions
      if (room.conventions && room.conventions.length > 0) {
        for (const conv of room.conventions) {
          // Vérifier le chevauchement de dates
          if (
            (dateDebut <= new Date(conv.dateFin) && dateFin >= new Date(conv.dateDebut))
          ) {
            unavailable.push(room.id);
            break;
          }
        }
      }
    }
    return unavailable;
  }

  // Supprimer une convention
  static async deleteConvention(id) {
    const convention = await Convention.findByPk(id, {
      include: [
        {
          model: Room,
          as: 'rooms',
          through: { attributes: [] }
        }
      ]
    });
    
    if (!convention) {
      throw new Error('Convention non trouvée');
    }

    // Supprimer les associations avec les chambres
    if (convention.rooms && convention.rooms.length > 0) {
      const roomIds = convention.rooms.map(room => room.id);
      await convention.removeRooms(roomIds);
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
    try {
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
            [Op.lte]: thirtyDaysFromNow,
            [Op.gte]: new Date()
          },
          statut: 'ACTIVE'
        }
      });

      return {
        totalConventions,
        activeConventions,
        inactiveConventions,
        expiredConventions,
        expiringSoon
      };
    } catch (error) {
      console.error('Erreur dans getConventionStats:', error);
      throw error;
    }
  }

  // Rechercher des conventions par société
  static async searchConventionsBySociete(nomSociete) {
    try {
      return await Convention.findAll({
        where: {
          nomSociete: { 
            [Op.like]: `%${nomSociete}%` 
          }
        },
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      console.error('Erreur dans searchConventionsBySociete:', error);
      throw error;
    }
  }

  // Obtenir les conventions actives
  static async getActiveConventions() {
    try {
      return await Convention.findAll({
        where: { statut: 'ACTIVE' },
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      console.error('Erreur dans getActiveConventions:', error);
      throw error;
    }
  }
}

module.exports = ConventionService; 