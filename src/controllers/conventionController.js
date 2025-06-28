const { Convention, User } = require('../models');
const { sequelize } = require('../config/database');
const path = require('path');
const fs = require('fs');
const ConventionService = require('../services/conventionService');

class ConventionController {
  // Récupérer toutes les conventions avec pagination et filtres
  static async getAllConventions(req, res) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        statut: req.query.statut,
        dateDebut: req.query.dateDebut,
        dateFin: req.query.dateFin
      };

      const conventions = await ConventionService.getAllConventions(filters);

      res.json({
        success: true,
        data: conventions.rows,
        pagination: {
          currentPage: parseInt(req.query.page || 1),
          totalPages: Math.ceil(conventions.count / (req.query.limit || 10)),
          totalItems: conventions.count,
          itemsPerPage: parseInt(req.query.limit || 10)
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des conventions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des conventions'
      });
    }
  }

  // Récupérer une convention spécifique
  static async getConventionById(req, res) {
    try {
      const convention = await ConventionService.getConventionById(req.params.id);

      if (!convention) {
        return res.status(404).json({
          success: false,
          message: 'Convention non trouvée'
        });
      }

      res.json({
        success: true,
        data: convention
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la convention:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la convention'
      });
    }
  }

  // Créer une nouvelle convention
  static async createConvention(req, res) {
    try {
      const convention = await ConventionService.createConvention(req.body, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Convention créée avec succès',
        data: convention
      });
    } catch (error) {
      console.error('Erreur lors de la création de la convention:', error);
      
      if (error.message.includes('existe déjà')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('date de fin')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la convention',
        details: error.message
      });
    }
  }

  // Modifier une convention
  static async updateConvention(req, res) {
    try {
      const convention = await ConventionService.updateConvention(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Convention modifiée avec succès',
        data: convention
      });
    } catch (error) {
      console.error('Erreur lors de la modification de la convention:', error);
      
      if (error.message.includes('Convention non trouvée')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('existe déjà')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('date de fin')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la modification de la convention',
        details: error.message
      });
    }
  }

  // Supprimer une convention
  static async deleteConvention(req, res) {
    try {
      await ConventionService.deleteConvention(req.params.id);

      res.json({
        success: true,
        message: 'Convention supprimée avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la convention:', error);
      
      if (error.message.includes('Convention non trouvée')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la convention'
      });
    }
  }

  // Upload du justificatif
  static async uploadJustificatif(req, res) {
    try {
      const file = req.files.justificatif;
      const result = await ConventionService.uploadJustificatif(req.params.id, file);

      res.json({
        success: true,
        message: 'Justificatif uploadé avec succès',
        data: result
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload du justificatif:', error);
      
      if (error.message.includes('Convention non trouvée')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload du justificatif'
      });
    }
  }

  // Télécharger le justificatif
  static async downloadJustificatif(req, res) {
    try {
      const filePath = await ConventionService.getJustificatifPath(req.params.id);
      res.download(filePath);
    } catch (error) {
      console.error('Erreur lors du téléchargement du justificatif:', error);
      
      if (error.message.includes('Convention non trouvée') || 
          error.message.includes('Aucun justificatif') ||
          error.message.includes('Fichier justificatif introuvable')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors du téléchargement du justificatif'
      });
    }
  }

  // Obtenir les statistiques des conventions
  static async getConventionStats(req, res) {
    try {
      const stats = await ConventionService.getConventionStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  // Rechercher des conventions par société
  static async searchConventionsBySociete(req, res) {
    try {
      const { nomSociete } = req.query;
      
      if (!nomSociete) {
        return res.status(400).json({
          success: false,
          message: 'Le nom de la société est requis'
        });
      }

      const conventions = await ConventionService.searchConventionsBySociete(nomSociete);

      res.json({
        success: true,
        data: conventions
      });
    } catch (error) {
      console.error('Erreur lors de la recherche des conventions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche des conventions'
      });
    }
  }

  // Obtenir les conventions actives
  static async getActiveConventions(req, res) {
    try {
      const conventions = await ConventionService.getActiveConventions();

      res.json({
        success: true,
        data: conventions
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des conventions actives:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des conventions actives'
      });
    }
  }
}

module.exports = ConventionController; 