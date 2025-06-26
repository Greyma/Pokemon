const { Convention, Room, Reservation, User } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

class ReservationAutomatiqueService {
  // Créer des réservations automatiques pour une convention
  static async creerReservationsAutomatiques(conventionId, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      // Récupérer la convention avec toutes les informations
      const convention = await Convention.findByPk(conventionId, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'role']
          }
        ],
        transaction
      });

      if (!convention) {
        throw new Error('Convention non trouvée');
      }

      if (convention.reservationsCreees) {
        throw new Error('Les réservations pour cette convention ont déjà été créées');
      }

      // Vérifier que la convention est active
      if (convention.statut !== 'ACTIVE') {
        throw new Error('Seules les conventions actives peuvent avoir des réservations automatiques');
      }

      // Obtenir la configuration des chambres
      const configChambres = convention.getConfigurationChambres();
      
      if (configChambres.total === 0) {
        throw new Error('Aucune chambre configurée pour cette convention');
      }

      // Vérifier la disponibilité des chambres pour la période
      const chambresDisponibles = await this.verifierDisponibiliteChambres(
        convention.dateDebut,
        convention.dateFin,
        configChambres,
        transaction
      );

      if (!chambresDisponibles.suffisantes) {
        throw new Error(`Chambres insuffisantes disponibles. Nécessaire: ${configChambres.total}, Disponible: ${chambresDisponibles.totalDisponible}`);
      }

      // Créer les réservations automatiques
      const reservationsCreees = await this.creerReservations(
        convention,
        chambresDisponibles.chambres,
        userId,
        transaction
      );

      // Marquer la convention comme ayant des réservations créées
      await convention.update({
        reservationAutomatique: true,
        reservationsCreees: true
      }, { transaction });

      await transaction.commit();

      return {
        success: true,
        message: `${reservationsCreees.length} réservations créées avec succès`,
        convention: convention,
        reservations: reservationsCreees,
        configuration: configChambres
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Vérifier la disponibilité des chambres
  static async verifierDisponibiliteChambres(dateDebut, dateFin, configChambres, transaction = null) {
    const options = transaction ? { transaction } : {};

    // Récupérer toutes les chambres disponibles par type
    const chambresDisponibles = await Room.findAll({
      where: {
        isActive: true,
        status: 'LIBRE'
      },
      order: [['type', 'ASC'], ['number', 'ASC']],
      ...options
    });

    // Grouper les chambres par type
    const chambresParType = {
      STANDARD: chambresDisponibles.filter(c => c.type === 'STANDARD'),
      VIP: chambresDisponibles.filter(c => c.type === 'VIP'),
      SUITE: chambresDisponibles.filter(c => c.type === 'SUITE')
    };

    // Vérifier les conflits de réservation pour la période
    const reservationsExistant = await Reservation.findAll({
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
      attributes: ['chambreId'],
      ...options
    });

    const chambresReservees = new Set(reservationsExistant.map(r => r.chambreId));

    // Filtrer les chambres vraiment disponibles
    const chambresDisponiblesFiltrees = {
      STANDARD: chambresParType.STANDARD.filter(c => !chambresReservees.has(c.id)),
      VIP: chambresParType.VIP.filter(c => !chambresReservees.has(c.id)),
      SUITE: chambresParType.SUITE.filter(c => !chambresReservees.has(c.id))
    };

    // Vérifier si on a assez de chambres
    const suffisantes = 
      chambresDisponiblesFiltrees.STANDARD.length >= configChambres.STANDARD &&
      chambresDisponiblesFiltrees.VIP.length >= configChambres.VIP &&
      chambresDisponiblesFiltrees.SUITE.length >= configChambres.SUITE;

    const totalDisponible = 
      chambresDisponiblesFiltrees.STANDARD.length +
      chambresDisponiblesFiltrees.VIP.length +
      chambresDisponiblesFiltrees.SUITE.length;

    return {
      suffisantes,
      totalDisponible,
      chambres: chambresDisponiblesFiltrees,
      details: {
        STANDARD: {
          necessaire: configChambres.STANDARD,
          disponible: chambresDisponiblesFiltrees.STANDARD.length
        },
        VIP: {
          necessaire: configChambres.VIP,
          disponible: chambresDisponiblesFiltrees.VIP.length
        },
        SUITE: {
          necessaire: configChambres.SUITE,
          disponible: chambresDisponiblesFiltrees.SUITE.length
        }
      }
    };
  }

  // Rechercher toutes les dates disponibles pour une période donnée
  static async rechercherDatesDisponibles(dateDebut, nombreJours, configChambres, dateFinMax = null) {
    try {
      // Si aucune date de fin maximale n'est spécifiée, utiliser 1 an à partir de la date de début
      if (!dateFinMax) {
        const dateMax = new Date(dateDebut);
        dateMax.setFullYear(dateMax.getFullYear() + 1);
        dateFinMax = dateMax.toISOString().split('T')[0];
      }

      // Calculer la date de fin de la période de recherche
      const dateFinRecherche = new Date(dateDebut);
      dateFinRecherche.setDate(dateFinRecherche.getDate() + nombreJours - 1);
      const dateFinRechercheStr = dateFinRecherche.toISOString().split('T')[0];

      // Récupérer toutes les chambres disponibles par type
      const chambresDisponibles = await Room.findAll({
        where: {
          isActive: true,
          status: 'LIBRE'
        },
        order: [['type', 'ASC'], ['number', 'ASC']]
      });

      // Grouper les chambres par type
      const chambresParType = {
        STANDARD: chambresDisponibles.filter(c => c.type === 'STANDARD'),
        VIP: chambresDisponibles.filter(c => c.type === 'VIP'),
        SUITE: chambresDisponibles.filter(c => c.type === 'SUITE')
      };

      // Vérifier si on a assez de chambres de chaque type
      const chambresSuffisantes = 
        chambresParType.STANDARD.length >= configChambres.STANDARD &&
        chambresParType.VIP.length >= configChambres.VIP &&
        chambresParType.SUITE.length >= configChambres.SUITE;

      if (!chambresSuffisantes) {
        return {
          success: false,
          message: 'Chambres insuffisantes disponibles',
          details: {
            STANDARD: {
              necessaire: configChambres.STANDARD,
              disponible: chambresParType.STANDARD.length
            },
            VIP: {
              necessaire: configChambres.VIP,
              disponible: chambresParType.VIP.length
            },
            SUITE: {
              necessaire: configChambres.SUITE,
              disponible: chambresParType.SUITE.length
            }
          }
        };
      }

      // Récupérer toutes les réservations existantes dans la période
      const reservationsExistant = await Reservation.findAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [
                {
                  dateEntree: {
                    [Op.lt]: dateFinMax,
                    [Op.gte]: dateDebut
                  }
                },
                {
                  dateSortie: {
                    [Op.gt]: dateDebut,
                    [Op.lte]: dateFinMax
                  }
                },
                {
                  dateEntree: { [Op.lte]: dateDebut },
                  dateSortie: { [Op.gte]: dateFinMax }
                }
              ]
            },
            {
              statut: { [Op.ne]: 'annulee' }
            }
          ]
        },
        attributes: ['chambreId', 'dateEntree', 'dateSortie'],
        order: [['dateEntree', 'ASC']]
      });

      // Créer un calendrier des chambres occupées
      const calendrierOccupations = new Map();
      
      // Initialiser le calendrier avec toutes les chambres disponibles
      chambresDisponibles.forEach(chambre => {
        calendrierOccupations.set(chambre.id, []);
      });

      // Ajouter les périodes d'occupation
      reservationsExistant.forEach(reservation => {
        const occupations = calendrierOccupations.get(reservation.chambreId) || [];
        occupations.push({
          dateEntree: reservation.dateEntree,
          dateSortie: reservation.dateSortie
        });
        calendrierOccupations.set(reservation.chambreId, occupations);
      });

      // Fonction pour vérifier si une période est disponible pour une chambre
      const estPeriodeDisponible = (chambreId, dateDebutPeriode, dateFinPeriode) => {
        const occupations = calendrierOccupations.get(chambreId) || [];
        
        for (const occupation of occupations) {
          // Vérifier s'il y a un chevauchement
          if (
            (dateDebutPeriode < occupation.dateSortie && dateFinPeriode > occupation.dateEntree) ||
            (occupation.dateEntree < dateFinPeriode && occupation.dateSortie > dateDebutPeriode)
          ) {
            return false;
          }
        }
        return true;
      };

      // Fonction pour vérifier la disponibilité pour une période donnée
      const verifierDisponibilitePeriode = (dateDebutPeriode, dateFinPeriode) => {
        const chambresDisponiblesParType = {
          STANDARD: [],
          VIP: [],
          SUITE: []
        };

        // Vérifier chaque chambre
        chambresDisponibles.forEach(chambre => {
          if (estPeriodeDisponible(chambre.id, dateDebutPeriode, dateFinPeriode)) {
            chambresDisponiblesParType[chambre.type].push(chambre);
          }
        });

        // Vérifier si on a assez de chambres de chaque type
        const suffisantes = 
          chambresDisponiblesParType.STANDARD.length >= configChambres.STANDARD &&
          chambresDisponiblesParType.VIP.length >= configChambres.VIP &&
          chambresDisponiblesParType.SUITE.length >= configChambres.SUITE;

        return {
          disponible: suffisantes,
          chambresDisponibles: chambresDisponiblesParType,
          details: {
            STANDARD: {
              necessaire: configChambres.STANDARD,
              disponible: chambresDisponiblesParType.STANDARD.length
            },
            VIP: {
              necessaire: configChambres.VIP,
              disponible: chambresDisponiblesParType.VIP.length
            },
            SUITE: {
              necessaire: configChambres.SUITE,
              disponible: chambresDisponiblesParType.SUITE.length
            }
          }
        };
      };

      // Générer toutes les dates possibles
      const datesDisponibles = [];
      const dateCourante = new Date(dateDebut);
      const dateFinMaxObj = new Date(dateFinMax);

      while (dateCourante <= dateFinMaxObj) {
        const dateDebutPeriode = new Date(dateCourante);
        const dateFinPeriode = new Date(dateCourante);
        dateFinPeriode.setDate(dateFinPeriode.getDate() + nombreJours - 1);

        // Vérifier si la période est disponible
        const disponibilite = verifierDisponibilitePeriode(dateDebutPeriode, dateFinPeriode);

        if (disponibilite.disponible) {
          datesDisponibles.push({
            dateDebut: dateDebutPeriode.toISOString().split('T')[0],
            dateFin: dateFinPeriode.toISOString().split('T')[0],
            nombreJours: nombreJours,
            disponibilite: disponibilite.details
          });
        }

        // Passer à la date suivante
        dateCourante.setDate(dateCourante.getDate() + 1);
      }

      return {
        success: true,
        message: `${datesDisponibles.length} périodes disponibles trouvées`,
        data: {
          configuration: configChambres,
          periodeRecherche: {
            dateDebut: dateDebut,
            dateFin: dateFinRechercheStr,
            dateFinMax: dateFinMax,
            nombreJours: nombreJours
          },
          datesDisponibles: datesDisponibles.sort((a, b) => new Date(a.dateDebut) - new Date(b.dateDebut)),
          total: datesDisponibles.length
        }
      };

    } catch (error) {
      throw new Error(`Erreur lors de la recherche des dates disponibles: ${error.message}`);
    }
  }

  // Nouvelle méthode pour rechercher avec nombre total de chambres
  static async rechercherDatesDisponiblesParNombreTotal(dateDebut, dateFin, nombreJours, nombreChambresTotal) {
    try {
      // Récupérer toutes les chambres disponibles
      const chambresDisponibles = await Room.findAll({
        where: {
          isActive: true,
          status: 'LIBRE'
        },
        order: [['type', 'ASC'], ['number', 'ASC']]
      });

      // Vérifier si on a assez de chambres au total
      if (chambresDisponibles.length < nombreChambresTotal) {
        return {
          success: false,
          message: `Chambres insuffisantes disponibles. Nécessaire: ${nombreChambresTotal}, Disponible: ${chambresDisponibles.length}`,
          details: {
            necessaire: nombreChambresTotal,
            disponible: chambresDisponibles.length
          }
        };
      }

      // Récupérer toutes les réservations existantes dans la période
      const reservationsExistant = await Reservation.findAll({
        where: {
          [Op.and]: [
            {
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
              ]
            },
            {
              statut: { [Op.ne]: 'annulee' }
            }
          ]
        },
        attributes: ['chambreId', 'dateEntree', 'dateSortie'],
        order: [['dateEntree', 'ASC']]
      });

      // Créer un calendrier des chambres occupées
      const calendrierOccupations = new Map();
      
      // Initialiser le calendrier avec toutes les chambres disponibles
      chambresDisponibles.forEach(chambre => {
        calendrierOccupations.set(chambre.id, []);
      });

      // Ajouter les périodes d'occupation
      reservationsExistant.forEach(reservation => {
        const occupations = calendrierOccupations.get(reservation.chambreId) || [];
        occupations.push({
          dateEntree: reservation.dateEntree,
          dateSortie: reservation.dateSortie
        });
        calendrierOccupations.set(reservation.chambreId, occupations);
      });

      // Fonction pour vérifier si une période est disponible pour une chambre
      const estPeriodeDisponible = (chambreId, dateDebutPeriode, dateFinPeriode) => {
        const occupations = calendrierOccupations.get(chambreId) || [];
        
        for (const occupation of occupations) {
          // Vérifier s'il y a un chevauchement
          if (
            (dateDebutPeriode < occupation.dateSortie && dateFinPeriode > occupation.dateEntree) ||
            (occupation.dateEntree < dateFinPeriode && occupation.dateSortie > dateDebutPeriode)
          ) {
            return false;
          }
        }
        return true;
      };

      // Fonction pour vérifier la disponibilité pour une période donnée
      const verifierDisponibilitePeriode = (dateDebutPeriode, dateFinPeriode) => {
        const chambresDisponiblesPourPeriode = [];

        // Vérifier chaque chambre
        chambresDisponibles.forEach(chambre => {
          if (estPeriodeDisponible(chambre.id, dateDebutPeriode, dateFinPeriode)) {
            chambresDisponiblesPourPeriode.push(chambre);
          }
        });

        // Vérifier si on a assez de chambres au total
        const suffisantes = chambresDisponiblesPourPeriode.length >= nombreChambresTotal;

        // Grouper par type pour les détails
        const chambresParType = {
          STANDARD: chambresDisponiblesPourPeriode.filter(c => c.type === 'STANDARD'),
          VIP: chambresDisponiblesPourPeriode.filter(c => c.type === 'VIP'),
          SUITE: chambresDisponiblesPourPeriode.filter(c => c.type === 'SUITE')
        };

        return {
          disponible: suffisantes,
          nombreChambresDisponibles: chambresDisponiblesPourPeriode.length,
          chambresDisponibles: chambresParType,
          details: {
            total: {
              necessaire: nombreChambresTotal,
              disponible: chambresDisponiblesPourPeriode.length
            },
            STANDARD: {
              disponible: chambresParType.STANDARD.length
            },
            VIP: {
              disponible: chambresParType.VIP.length
            },
            SUITE: {
              disponible: chambresParType.SUITE.length
            }
          }
        };
      };

      // Générer toutes les dates possibles dans la période spécifiée
      const datesDisponibles = [];
      const dateCourante = new Date(dateDebut);
      const dateFinObj = new Date(dateFin);

      while (dateCourante <= dateFinObj) {
        const dateDebutPeriode = new Date(dateCourante);
        const dateFinPeriode = new Date(dateCourante);
        dateFinPeriode.setDate(dateFinPeriode.getDate() + nombreJours - 1);

        // Vérifier si la période est disponible
        const disponibilite = verifierDisponibilitePeriode(dateDebutPeriode, dateFinPeriode);

        if (disponibilite.disponible) {
          datesDisponibles.push({
            dateDebut: dateDebutPeriode.toISOString().split('T')[0],
            dateFin: dateFinPeriode.toISOString().split('T')[0],
            nombreJours: nombreJours,
            nombreChambresDisponibles: disponibilite.nombreChambresDisponibles,
            disponibilite: disponibilite.details
          });
        }

        // Passer à la date suivante
        dateCourante.setDate(dateCourante.getDate() + 1);
      }

      return {
        success: true,
        message: `${datesDisponibles.length} périodes disponibles trouvées`,
        data: {
          configuration: {
            nombreChambresTotal: nombreChambresTotal,
            nombreJours: nombreJours
          },
          periodeRecherche: {
            dateDebut: dateDebut,
            dateFin: dateFin,
            nombreJours: nombreJours
          },
          datesDisponibles: datesDisponibles.sort((a, b) => new Date(a.dateDebut) - new Date(b.dateDebut)),
          total: datesDisponibles.length
        }
      };

    } catch (error) {
      throw new Error(`Erreur lors de la recherche des dates disponibles: ${error.message}`);
    }
  }

  // Créer les réservations automatiques
  static async creerReservations(convention, chambresDisponibles, userId, transaction) {
    const reservations = [];
    const configChambres = convention.getConfigurationChambres();

    // Créer les réservations pour chaque type de chambre
    for (const typeChambre of ['STANDARD', 'VIP', 'SUITE']) {
      const nombreChambres = configChambres[typeChambre];
      const chambres = chambresDisponibles[typeChambre].slice(0, nombreChambres);

      for (let i = 0; i < chambres.length; i++) {
        const chambre = chambres[i];
        
        // Générer un ID de réservation unique
        const reservationId = `CONV-${convention.numeroConvention}-${typeChambre}-${i + 1}`;
        
        // Créer la réservation
        const reservation = await Reservation.create({
          reservationId,
          nomClient: `${convention.nomSociete} - Convention`,
          email: convention.email || 'convention@hotel.com',
          telephone: convention.telephone,
          adresse: convention.adresse || 'Adresse de la convention',
          dateEntree: convention.dateDebut,
          dateSortie: convention.dateFin,
          nombrePersonnes: convention.nombreAdultesMaxParChambre,
          chambreId: chambre.id,
          numeroChambre: chambre.number,
          typeChambre: chambre.type,
          montantTotal: convention.prixConvention,
          paiements: [{
            montant: convention.prixConvention,
            methode: 'CONVENTION',
            date: new Date(),
            statut: 'PAYE'
          }],
          nomGarant: convention.contactPrincipal || convention.nomSociete,
          remarques: `Réservation automatique - Convention ${convention.numeroConvention}`,
          receptionnisteId: userId,
          receptionniste: 'Système automatique',
          statut: 'validee'
        }, { transaction });

        // Mettre à jour le statut de la chambre
        await chambre.update({
          status: 'RÉSERVÉE'
        }, { transaction });

        reservations.push(reservation);
      }
    }

    return reservations;
  }

  // Annuler les réservations automatiques d'une convention
  static async annulerReservationsAutomatiques(conventionId) {
    const transaction = await sequelize.transaction();
    
    try {
      const convention = await Convention.findByPk(conventionId, { transaction });
      
      if (!convention) {
        throw new Error('Convention non trouvée');
      }

      // Trouver toutes les réservations de cette convention
      const reservations = await Reservation.findAll({
        where: {
          reservationId: {
            [Op.like]: `CONV-${convention.numeroConvention}-%`
          },
          statut: { [Op.ne]: 'annulee' }
        },
        transaction
      });

      // Annuler chaque réservation
      for (const reservation of reservations) {
        await reservation.update({
          statut: 'annulee'
        }, { transaction });

        // Libérer la chambre
        await Room.update({
          status: 'LIBRE'
        }, {
          where: { id: reservation.chambreId },
          transaction
        });
      }

      // Mettre à jour la convention
      await convention.update({
        reservationAutomatique: false,
        reservationsCreees: false
      }, { transaction });

      await transaction.commit();

      return {
        success: true,
        message: `${reservations.length} réservations annulées avec succès`,
        reservationsAnnulees: reservations.length
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Obtenir le statut des réservations d'une convention
  static async getStatutReservations(conventionId) {
    const convention = await Convention.findByPk(conventionId);
    
    if (!convention) {
      throw new Error('Convention non trouvée');
    }

    const reservations = await Reservation.findAll({
      where: {
        reservationId: {
          [Op.like]: `CONV-${convention.numeroConvention}-%`
        }
      },
      include: [
        {
          model: Room,
          attributes: ['number', 'type', 'status']
        }
      ],
      order: [['dateCreation', 'ASC']]
    });

    const configChambres = convention.getConfigurationChambres();
    const reservationsParType = {
      STANDARD: reservations.filter(r => r.typeChambre === 'STANDARD'),
      VIP: reservations.filter(r => r.typeChambre === 'VIP'),
      SUITE: reservations.filter(r => r.typeChambre === 'SUITE')
    };

    return {
      convention: convention,
      configuration: configChambres,
      reservations: {
        total: reservations.length,
        parType: {
          STANDARD: reservationsParType.STANDARD.length,
          VIP: reservationsParType.VIP.length,
          SUITE: reservationsParType.SUITE.length
        },
        details: reservationsParType
      },
      statut: {
        reservationsCreees: convention.reservationsCreees,
        reservationAutomatique: convention.reservationAutomatique
      }
    };
  }

  // Vérifier la disponibilité pour une nouvelle convention
  static async verifierDisponibiliteNouvelleConvention(dateDebut, dateFin, configChambres) {
    return await this.verifierDisponibiliteChambres(dateDebut, dateFin, configChambres);
  }
}

module.exports = ReservationAutomatiqueService; 