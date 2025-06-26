const { Convention, User } = require('../models');
const { sequelize } = require('../config/database');
const path = require('path');
const fs = require('fs');
const ConventionService = require('../services/conventionService');
const ReservationAutomatiqueService = require('../services/reservationAutomatiqueService');

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

  // Créer des réservations automatiques pour une convention
  static async creerReservationsAutomatiques(req, res) {
    try {
      const result = await ReservationAutomatiqueService.creerReservationsAutomatiques(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        message: result.message,
        data: {
          convention: result.convention,
          reservations: result.reservations,
          configuration: result.configuration
        }
      });
    } catch (error) {
      console.error('Erreur lors de la création des réservations automatiques:', error);
      
      if (error.message.includes('Convention non trouvée')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('déjà été créées')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('Chambres insuffisantes')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création des réservations automatiques',
        details: error.message
      });
    }
  }

  // Annuler les réservations automatiques d'une convention
  static async annulerReservationsAutomatiques(req, res) {
    try {
      const result = await ReservationAutomatiqueService.annulerReservationsAutomatiques(req.params.id);

      res.json({
        success: true,
        message: result.message,
        data: {
          reservationsAnnulees: result.reservationsAnnulees
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'annulation des réservations automatiques:', error);
      
      if (error.message.includes('Convention non trouvée')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'annulation des réservations automatiques',
        details: error.message
      });
    }
  }

  // Obtenir le statut des réservations d'une convention
  static async getStatutReservations(req, res) {
    try {
      const result = await ReservationAutomatiqueService.getStatutReservations(req.params.id);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du statut des réservations:', error);
      
      if (error.message.includes('Convention non trouvée')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du statut des réservations',
        details: error.message
      });
    }
  }

  // Vérifier la disponibilité des chambres pour une convention
  static async verifierDisponibiliteChambres(req, res) {
    try {
      const { dateDebut, dateFin, chambresStandard, chambresVIP, chambresSuite } = req.body;

      if (!dateDebut || !dateFin) {
        return res.status(400).json({
          success: false,
          message: 'Les dates de début et de fin sont requises'
        });
      }

      const configChambres = {
        STANDARD: chambresStandard || 0,
        VIP: chambresVIP || 0,
        SUITE: chambresSuite || 0,
        total: (chambresStandard || 0) + (chambresVIP || 0) + (chambresSuite || 0)
      };

      if (configChambres.total === 0) {
        return res.status(400).json({
          success: false,
          message: 'Au moins une chambre doit être configurée'
        });
      }

      const disponibilite = await ReservationAutomatiqueService.verifierDisponibiliteNouvelleConvention(
        dateDebut,
        dateFin,
        configChambres
      );

      res.json({
        success: true,
        data: {
          disponibilite,
          configuration: configChambres
        }
      });
    } catch (error) {
      console.error('Erreur lors de la vérification de disponibilité:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification de disponibilité',
        details: error.message
      });
    }
  }

  // Rechercher toutes les dates disponibles pour une période donnée
  static async rechercherDatesDisponibles(req, res) {
    try {
      const { 
        dateDebut, 
        dateFin,
        nombreJours, 
        chambresStandard, 
        chambresVIP, 
        chambresSuite, 
        dateFinMax 
      } = req.body;

      // Validation des paramètres requis
      if (!dateDebut) {
        return res.status(400).json({
          success: false,
          message: 'La date de début est requise'
        });
      }

      // Si dateFin est fournie, calculer nombreJours automatiquement
      let nombreJoursCalcule = nombreJours;
      if (dateFin && !nombreJours) {
        const dateDebutObj = new Date(dateDebut);
        const dateFinObj = new Date(dateFin);
        const diffTime = dateFinObj - dateDebutObj;
        nombreJoursCalcule = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      } else if (!nombreJours) {
        return res.status(400).json({
          success: false,
          message: 'Le nombre de jours ou la date de fin est requis'
        });
      }

      if (nombreJoursCalcule < 1 || nombreJoursCalcule > 365) {
        return res.status(400).json({
          success: false,
          message: 'Le nombre de jours doit être entre 1 et 365'
        });
      }

      // Configuration des chambres
      const configChambres = {
        STANDARD: chambresStandard || 0,
        VIP: chambresVIP || 0,
        SUITE: chambresSuite || 0,
        total: (chambresStandard || 0) + (chambresVIP || 0) + (chambresSuite || 0)
      };

      if (configChambres.total === 0) {
        return res.status(400).json({
          success: false,
          message: 'Au moins une chambre doit être configurée'
        });
      }

      // Rechercher les dates disponibles
      const result = await ReservationAutomatiqueService.rechercherDatesDisponibles(
        dateDebut,
        nombreJoursCalcule,
        configChambres,
        dateFinMax
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          details: result.details
        });
      }

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      console.error('Erreur lors de la recherche des dates disponibles:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche des dates disponibles',
        details: error.message
      });
    }
  }

  // Rechercher les dates disponibles par nombre total de chambres
  static async rechercherDatesDisponiblesParNombreTotal(req, res) {
    try {
      const { 
        dateDebut, 
        dateFin, 
        nombreJours, 
        nombreChambresTotal 
      } = req.body;

      // Validation des paramètres requis
      if (!dateDebut || !dateFin || !nombreJours || !nombreChambresTotal) {
        return res.status(400).json({
          success: false,
          message: 'Tous les paramètres sont requis : dateDebut, dateFin, nombreJours, nombreChambresTotal'
        });
      }

      if (nombreJours < 1 || nombreJours > 365) {
        return res.status(400).json({
          success: false,
          message: 'Le nombre de jours doit être entre 1 et 365'
        });
      }

      if (nombreChambresTotal < 1 || nombreChambresTotal > 100) {
        return res.status(400).json({
          success: false,
          message: 'Le nombre de chambres total doit être entre 1 et 100'
        });
      }

      // Vérifier que dateFin est postérieure à dateDebut
      const dateDebutObj = new Date(dateDebut);
      const dateFinObj = new Date(dateFin);
      if (dateFinObj <= dateDebutObj) {
        return res.status(400).json({
          success: false,
          message: 'La date de fin doit être postérieure à la date de début'
        });
      }

      // Rechercher les dates disponibles
      const result = await ReservationAutomatiqueService.rechercherDatesDisponiblesParNombreTotal(
        dateDebut,
        dateFin,
        nombreJours,
        nombreChambresTotal
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          details: result.details
        });
      }

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      console.error('Erreur lors de la recherche des dates disponibles par nombre total:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche des dates disponibles',
        details: error.message
      });
    }
  }
}

module.exports = ConventionController; 