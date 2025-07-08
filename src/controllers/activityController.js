const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Activity } = require('../models');
const { Op } = require('sequelize');

const generateActivityPDF = async (req, res) => {
  try {
    const { type, date, period, reservations, totalGuests } = req.body;

    if (!type || !date) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Type et date requis' 
      });
    }

    const allowedTypes = ['restaurant', 'pool', 'gym'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Type d\'activité invalide' 
      });
    }

    // Créer le répertoire public/activities s'il n'existe pas
    const publicDir = path.join(__dirname, '../../public');
    const activitiesDir = path.join(publicDir, 'activities');
    
    try {
      await fs.promises.mkdir(publicDir, { recursive: true });
      await fs.promises.mkdir(activitiesDir, { recursive: true });
    } catch (error) {
      console.error('Erreur lors de la création des répertoires:', error);
      return res.status(500).json({ 
        status: 'error',
        message: 'Erreur lors de la création des répertoires' 
      });
    }

    const doc = new PDFDocument();
    const filename = `${type}_${date}.pdf`;
    const filepath = path.join(activitiesDir, filename);

    // Écrire le PDF
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // En-tête
    doc.fontSize(25).text('Rapport d\'activité', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Type: ${type}`);
    doc.fontSize(16).text(`Date: ${date}`);
    doc.fontSize(16).text(`Période: ${period}`);
    doc.fontSize(16).text(`Total invités: ${totalGuests}`);
    doc.moveDown();

    // Contenu spécifique selon le type
    switch (type) {
      case 'restaurant':
        doc.fontSize(14).text('Réservations du restaurant');
        if (reservations && reservations.length > 0) {
          reservations.forEach(res => {
            doc.fontSize(12).text(`- ${res.clientName}: ${res.numberOfAdults} personnes`);
          });
        } else {
          doc.fontSize(12).text('Aucune réservation');
        }
        break;
      case 'pool':
        doc.fontSize(14).text('Utilisation de la piscine');
        if (reservations && reservations.length > 0) {
          reservations.forEach(res => {
            doc.fontSize(12).text(`- ${res.clientName}: ${res.numberOfAdults} personnes`);
          });
        } else {
          doc.fontSize(12).text('Aucune réservation');
        }
        break;
      case 'gym':
        doc.fontSize(14).text('Fréquentation de la salle de sport');
        if (reservations && reservations.length > 0) {
          reservations.forEach(res => {
            doc.fontSize(12).text(`- ${res.clientName}: ${res.numberOfAdults} personnes`);
          });
        } else {
          doc.fontSize(12).text('Aucune réservation');
        }
        break;
    }

    doc.end();

    // Attendre que le fichier soit écrit
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    res.json({
      status: 'success',
      data: {
        pdfUrl: `/activities/${filename}`
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Erreur lors de la génération du PDF' 
    });
  }
};

class ActivityController {
  // Récupérer toutes les activités
  static async getAllActivities(req, res) {
    try {
      const { page = 1, limit = 10, search, isActive } = req.query;
      const offset = (page - 1) * limit;

      // Construire les conditions de recherche
      const whereClause = {};
      
      if (search) {
        whereClause.nomActivite = {
          [Op.like]: `%${search}%`
        };
      }

      if (isActive !== undefined) {
        whereClause.isActive = isActive === 'true';
      }

      const activities = await Activity.findAndCountAll({
        where: whereClause,
        order: [['nomActivite', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: activities.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(activities.count / limit),
          totalItems: activities.count,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des activités:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des activités'
      });
    }
  }

  // Récupérer une activité par ID
  static async getActivityById(req, res) {
    try {
      const activity = await Activity.findByPk(req.params.id);

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Activité non trouvée'
        });
      }

      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'activité:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'activité'
      });
    }
  }

  // Créer une nouvelle activité
  static async createActivity(req, res) {
    try {
      const { nomActivite, prix, description } = req.body;

      // Vérifier les données requises
      if (!nomActivite || prix === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Le nom de l\'activité et le prix sont requis'
        });
      }

      // Vérifier que le prix est positif
      if (prix < 0) {
        return res.status(400).json({
          success: false,
          message: 'Le prix doit être positif'
        });
      }

      // Vérifier si l'activité existe déjà
      const existingActivity = await Activity.findOne({
        where: { nomActivite }
      });

      if (existingActivity) {
        return res.status(409).json({
          success: false,
          message: 'Une activité avec ce nom existe déjà'
        });
      }

      const activity = await Activity.create({
        nomActivite,
        prix: parseFloat(prix),
        description: description || null
      });

      res.status(201).json({
        success: true,
        message: 'Activité créée avec succès',
        data: activity
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'activité:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          details: error.errors.map(e => ({
            field: e.path,
            message: e.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'activité'
      });
    }
  }

  // Modifier une activité
  static async updateActivity(req, res) {
    try {
      const { nomActivite, prix, description, isActive } = req.body;
      const activity = await Activity.findByPk(req.params.id);

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Activité non trouvée'
        });
      }

      // Vérifier que le prix est positif si fourni
      if (prix !== undefined && prix < 0) {
        return res.status(400).json({
          success: false,
          message: 'Le prix doit être positif'
        });
      }

      // Vérifier si le nouveau nom existe déjà (sauf pour cette activité)
      if (nomActivite && nomActivite !== activity.nomActivite) {
        const existingActivity = await Activity.findOne({
          where: { 
            nomActivite,
            id: { [Op.ne]: req.params.id }
          }
        });

        if (existingActivity) {
          return res.status(409).json({
            success: false,
            message: 'Une activité avec ce nom existe déjà'
          });
        }
      }

      const updateData = {};
      if (nomActivite !== undefined) updateData.nomActivite = nomActivite;
      if (prix !== undefined) updateData.prix = parseFloat(prix);
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.isActive = isActive;

      await activity.update(updateData);

      res.json({
        success: true,
        message: 'Activité modifiée avec succès',
        data: activity
      });
    } catch (error) {
      console.error('Erreur lors de la modification de l\'activité:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          details: error.errors.map(e => ({
            field: e.path,
            message: e.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la modification de l\'activité'
      });
    }
  }

  // Supprimer une activité
  static async deleteActivity(req, res) {
    try {
      const activity = await Activity.findByPk(req.params.id);

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Activité non trouvée'
        });
      }

      await activity.destroy();

      res.json({
        success: true,
        message: 'Activité supprimée avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'activité:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'activité'
      });
    }
  }

  // Activer/Désactiver une activité
  static async toggleActivityStatus(req, res) {
    try {
      const activity = await Activity.findByPk(req.params.id);

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Activité non trouvée'
        });
      }

      await activity.update({ isActive: !activity.isActive });

      res.json({
        success: true,
        message: `Activité ${activity.isActive ? 'activée' : 'désactivée'} avec succès`,
        data: activity
      });
    } catch (error) {
      console.error('Erreur lors du changement de statut de l\'activité:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du changement de statut de l\'activité'
      });
    }
  }

  // Rechercher des activités
  static async searchActivities(req, res) {
    try {
      const { search } = req.query;
      
      if (!search) {
        return res.status(400).json({
          success: false,
          message: 'Le terme de recherche est requis'
        });
      }

      const activities = await Activity.findAll({
        where: {
          nomActivite: {
            [Op.like]: `%${search}%`
          },
          isActive: true
        },
        order: [['nomActivite', 'ASC']]
      });

      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      console.error('Erreur lors de la recherche des activités:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche des activités'
      });
    }
  }

  // Obtenir les activités actives
  static async getActiveActivities(req, res) {
    try {
      const activities = await Activity.findAll({
        where: { isActive: true },
        order: [['nomActivite', 'ASC']]
      });

      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des activités actives:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des activités actives'
      });
    }
  }

  // Rapport de présence à une activité sur une période
  static async reportActivityPresence(req, res) {
    try {
      const { activityId } = req.params;
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Les dates de début et de fin sont requises'
        });
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start) || isNaN(end) || start > end) {
        return res.status(400).json({
          success: false,
          message: 'Dates invalides'
        });
      }
      // Importer Reservation et Room
      const { Reservation, Room } = require('../models');
      // Chercher toutes les réservations qui incluent cette activité et qui sont sur la période
      const reservations = await Reservation.findAll({
        where: {
          dateEntree: { [Op.lte]: end },
          dateSortie: { [Op.gte]: start },
          statut: { [Op.notIn]: ['annulee', 'terminee'] }
        },
        include: [
          {
            model: Room,
            attributes: ['number']
          }
        ]
      });
      // Pour chaque jour de la période, calculer le bilan
      const result = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const day = d.toISOString().split('T')[0];
        let totalAdults = 0;
        let totalChildren = 0;
        let dayReservations = [];
        for (const r of reservations) {
          // Vérifier si la réservation est active ce jour-là
          const entree = new Date(r.dateEntree);
          const sortie = new Date(r.dateSortie);
          if (entree <= d && sortie >= d) {
            // Vérifier si l'activité est dans la réservation
            const activities = Array.isArray(r.activites) ? r.activites : [];
            if (activities.some(a => a.id == activityId || a === activityId)) {
              totalAdults += r.nombreAdultes || 0;
              totalChildren += r.nombreEnfants || 0;
              dayReservations.push({
                reservationId: r.reservationId,
                clientName: r.nomClient,
                roomNumber: r.Room ? r.Room.number : null,
                adults: r.nombreAdultes || 0,
                children: r.nombreEnfants || 0
              });
            }
          }
        }
        result.push({
          date: day,
          totalAdults,
          totalChildren,
          reservations: dayReservations
        });
      }
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erreur lors du rapport de présence activité:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du rapport de présence activité'
      });
    }
  }
}

module.exports = {
  generateActivityPDF,
  ActivityController
}; 