const { Reservation, Room, User } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;
const PDFDocument = require('pdfkit');

// Créer une nouvelle réservation
exports.createReservation = async (req, res) => {
  try {
    const {
      reservationId,
      nomClient,
      email,
      telephone,
      adresse,
      dateEntree,
      dateSortie,
      nombrePersonnes,
      chambreId,
      numeroChambre,
      typeChambre,
      montantTotal,
      paiements,
      nomGarant,
      remarques,
      receptionnisteId,
      receptionniste
    } = req.body;

    // Vérifier les données requises
    if (!reservationId || !nomClient || !email || !telephone || !adresse || !dateEntree || !dateSortie || 
        !nombrePersonnes || !chambreId || !numeroChambre || !typeChambre || !montantTotal || !receptionnisteId || !receptionniste) {
      return res.status(400).json({
        success: false,
        message: 'Données de réservation incomplètes'
      });
    }

    // Vérifier les dates
    const checkIn = new Date(dateEntree);
    const checkOut = new Date(dateSortie);
    if (checkIn >= checkOut) {
      return res.status(400).json({
        success: false,
        message: 'La date de départ doit être postérieure à la date d\'arrivée'
      });
    }

    // Vérifier la chambre
    const room = await Room.findByPk(chambreId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }

    // Vérifier la disponibilité de la chambre
    const existingReservation = await Reservation.findOne({
      where: {
        chambreId,
        [Op.or]: [
          {
            dateEntree: {
              [Op.between]: [checkIn, checkOut]
            }
          },
          {
            dateSortie: {
              [Op.between]: [checkIn, checkOut]
            }
          }
        ],
        statut: {
          [Op.notIn]: ['annulee']
        }
      }
    });

    if (existingReservation) {
      return res.status(400).json({
        success: false,
        message: 'Chambre non disponible pour les dates spécifiées'
      });
    }

    // Gérer l'upload du fichier PDF si présent
    let preuvePaiementPath = null;
    if (req.files && req.files.preuvePaiement) {
      const file = req.files.preuvePaiement;

      // Vérifier le type de fichier
      if (file.mimetype !== 'application/pdf') {
        return res.status(400).json({
          success: false,
          message: 'Seuls les fichiers PDF sont acceptés'
        });
      }

      // Vérifier la taille du fichier (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: 'Le fichier est trop volumineux (max 5MB)'
        });
      }

      // Créer le dossier uploads/payments s'il n'existe pas
      const uploadDir = path.join(__dirname, '../uploads/payments');
      await fs.mkdir(uploadDir, { recursive: true });

      // Générer un nom de fichier unique
      const fileName = `${reservationId}_${Date.now()}.pdf`;
      const filePath = path.join(uploadDir, fileName);

      // Sauvegarder le fichier
      await file.mv(filePath);

      // Stocker le chemin relatif
      preuvePaiementPath = `/uploads/payments/${fileName}`;
    }

    // Calculer le montant total des paiements
    const totalPaiements = paiements ? paiements.reduce((sum, paiement) => sum + paiement.montant, 0) : 0;
    
    // Déterminer le statut initial en fonction des paiements
    const statut = totalPaiements >= montantTotal ? 'validee' : 'en_cours';

    // Créer la réservation
    const reservation = await Reservation.create({
      reservationId,
      nomClient,
      email,
      telephone,
      adresse,
      dateEntree: checkIn,
      dateSortie: checkOut,
      nombrePersonnes,
      chambreId,
      numeroChambre,
      typeChambre,
      montantTotal,
      paiements: paiements || [],
      nomGarant: nomGarant || '',
      remarques: remarques || '',
      receptionnisteId,
      statut,
      dateCreation: new Date(),
      receptionniste,
      preuvePaiement: preuvePaiementPath
    });

    // Mettre à jour le statut de la chambre
    await room.update({ status: 'RÉSERVÉE' });

    res.status(201).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la réservation'
    });
  }
};

// Calculer le prix d'une réservation
exports.calculatePrice = async (req, res) => {
  try {
    const { checkInDate, checkOutDate, roomId, numberOfAdults } = req.body;

    // Vérifier les données requises
    if (!checkInDate || !checkOutDate || !numberOfAdults) {
      return res.status(400).json({
        success: false,
        message: 'Données incomplètes pour le calcul du prix'
      });
    }

    // Vérifier les dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkIn >= checkOut) {
      return res.status(400).json({
        success: false,
        message: 'La date de départ doit être postérieure à la date d\'arrivée'
      });
    }

    // Si roomId n'est pas fourni, retourner un prix par défaut
    if (!roomId) {
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const defaultBasePrice = 10000; // Prix par défaut
      const defaultExtraPersonPrice = 2000; // Prix par personne supplémentaire par défaut
      const defaultCapacity = 2; // Capacité par défaut
      const extraAdults = Math.max(0, numberOfAdults - defaultCapacity);
      const basePrice = defaultBasePrice * nights;
      const extraPrice = extraAdults * defaultExtraPersonPrice * nights;
      const totalPrice = basePrice + extraPrice;

      return res.json({
        success: true,
        data: {
          totalPrice,
          priceDetails: {
            basePrice,
            extraPersonPrice: defaultExtraPersonPrice,
            nights,
            capacity: defaultCapacity,
            extraAdults,
            basePrice: basePrice,
            extraPrice
          }
        }
      });
    }

    // Vérifier la chambre
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }

    // Calculer le prix total
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const basePrice = room.basePrice * nights;
    const extraAdults = Math.max(0, numberOfAdults - room.capacity);
    const extraPrice = extraAdults * room.extraPersonPrice * nights;
    const totalPrice = basePrice + extraPrice;

    res.json({
      success: true,
      data: {
        totalPrice,
        priceDetails: {
          basePrice,
          extraPersonPrice: room.extraPersonPrice,
          nights,
          capacity: room.capacity,
          extraAdults,
          basePrice: basePrice,
          extraPrice
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors du calcul du prix:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul du prix'
    });
  }
};

// Obtenir toutes les réservations
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.findAll({
      order: [['dateCreation', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: reservations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réservations'
    });
  }
};

// Récupérer une réservation par son ID
exports.getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la réservation'
    });
  }
};

// Mettre à jour le statut d'une réservation
exports.updateStatus = async (req, res) => {
  try {
    const { statut } = req.body;
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier si c'est une tentative d'annulation
    if (statut === 'annulee') {
      const dateReservation = new Date(reservation.dateCreation);
      const maintenant = new Date();
      const differenceHeures = (maintenant - dateReservation) / (1000 * 60 * 60);

      // Si c'est un réceptionniste, vérifier le délai de 48h
      if (req.user.role === 'RECEPTIONIST' && differenceHeures > 48) {
        return res.status(403).json({
          success: false,
          message: 'Impossible d\'annuler la réservation après 48h. Veuillez contacter le manager.'
        });
      }
    }

    // Mettre à jour le statut
    await reservation.update({ statut });

    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
};

// Ajouter un paiement à une réservation
exports.addPayment = async (req, res) => {
  try {
    const {
      paiementId,
      methodePaiement,
      montant,
      datePaiement,
      numeroCCP,
      numeroTransaction,
      preuvePaiement
    } = req.body;

    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    const newPayment = {
      paiementId,
      methodePaiement,
      montant,
      datePaiement,
      numeroCCP,
      numeroTransaction,
      preuvePaiement
    };

    const paiements = [...reservation.paiements, newPayment];
    
    // Calculer le total des paiements
    const totalPaiements = paiements.reduce((sum, paiement) => sum + paiement.montant, 0);
    
    // Mettre à jour le statut en fonction du total des paiements
    const statut = totalPaiements >= reservation.montantTotal ? 'validee' : 'en_cours';

    await reservation.update({ 
      paiements,
      statut
    });

    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du paiement'
    });
  }
};

// Upload du justificatif de paiement
exports.uploadPdf = async (req, res) => {
  try {
    console.log('📁 Début de l\'upload PDF');

    // Vérifier le type de contenu
    if (!req.headers['content-type']?.includes('multipart/form-data')) {
      return res.status(400).json({
        success: false,
        message: 'Type de contenu invalide. Utilisez multipart/form-data'
      });
    }

    // Vérifier si req.files existe
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier n\'a été uploadé'
      });
    }

    const { reservationId, paymentId } = req.body;
    const file = req.files.file;

    // Vérifier le type de fichier
    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Seuls les fichiers PDF sont acceptés'
      });
    }

    // Vérifier la taille du fichier (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Le fichier est trop volumineux (max 5MB)'
      });
    }

    // Vérifier que la réservation existe
    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Créer le dossier uploads/payments s'il n'existe pas
    const uploadDir = path.join(__dirname, '../uploads/payments');
    await fs.mkdir(uploadDir, { recursive: true });

    // Générer un nom de fichier unique
    const fileName = `${reservationId}_${paymentId}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    // Sauvegarder le fichier
    await file.mv(filePath);

    // Retourner le chemin relatif du fichier
    const relativePath = `/uploads/payments/${fileName}`;

    res.json({
      success: true,
      data: {
        filePath: relativePath,
        fileName: fileName
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload du PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload du PDF'
    });
  }
};

// Mettre à jour les dates réelles d'entrée/sortie
exports.updateRealDates = async (req, res) => {
  try {
    const { dateEntreeReelle, dateSortieReelle } = req.body;
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Mettre à jour les dates réelles
    const updates = {};
    if (dateEntreeReelle) updates.dateEntreeReelle = new Date(dateEntreeReelle);
    if (dateSortieReelle) updates.dateSortieReelle = new Date(dateSortieReelle);

    // Mettre à jour le statut uniquement si la date de sortie est fournie
    if (dateSortieReelle) {
      updates.statut = 'terminee';
    }

    await reservation.update(updates);

    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des dates réelles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des dates réelles'
    });
  }
};

// Obtenir les chambres disponibles
exports.getAvailableRooms = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Les dates de check-in et check-out sont requises'
      });
    }

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'La date de check-out doit être postérieure à la date de check-in'
      });
    }

    // Trouver les chambres réservées pour la période
    const reservedRooms = await Reservation.findAll({
      where: {
        [Op.or]: [
          {
            dateEntree: { [Op.between]: [startDate, endDate] }
          },
          {
            dateSortie: { [Op.between]: [startDate, endDate] }
          },
          {
            [Op.and]: [
              { dateEntree: { [Op.lte]: startDate } },
              { dateSortie: { [Op.gte]: endDate } }
            ]
          }
        ],
        statut: {
          [Op.notIn]: ['annulee', 'terminee'] // Exclure les réservations annulées et terminées
        }
      },
      attributes: ['chambreId']
    });

    const reservedRoomIds = reservedRooms.map(r => r.chambreId);

    // Trouver toutes les chambres disponibles
    const availableRooms = await Room.findAll({
      where: {
        id: { [Op.notIn]: reservedRoomIds },
        isActive: true
      },
      attributes: ['id', 'number', 'type', 'basePrice', 'extraPersonPrice', 'capacity']
    });

    res.json({
      success: true,
      data: availableRooms
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des chambres disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des chambres disponibles'
    });
  }
};

// Générer une facture
exports.generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Génération de facture pour la réservation:', id);

    const reservation = await Reservation.findByPk(id, {
      include: [
        { model: Room },
        { model: User, as: 'creator' }
      ]
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Créer le dossier invoices s'il n'existe pas
    const invoicesDir = path.join(__dirname, '../invoices');
    await fs.mkdir(invoicesDir, { recursive: true });

    // Générer un nom de fichier unique
    const filename = `invoice_${reservation.id}_${Date.now()}.pdf`;
    const filepath = path.join(invoicesDir, filename);

    // Créer le PDF
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filepath);
    doc.pipe(writeStream);

    // En-tête
    doc.fontSize(20).text('Facture de Réservation', { align: 'center' });
    doc.moveDown();

    // Informations de la réservation
    doc.fontSize(12);
    doc.text(`Numéro de réservation: ${reservation.id}`);
    doc.text(`Client: ${reservation.nomClient}`);
    doc.text(`Type de client: ${reservation.clientType}`);
    doc.text(`Chambre: ${reservation.Room.number} (${reservation.Room.type})`);
    doc.text(`Arrivée: ${reservation.dateEntree.toLocaleDateString()}`);
    doc.text(`Départ: ${reservation.dateSortie.toLocaleDateString()}`);
    doc.text(`Nombre d'adultes: ${reservation.nombrePersonnes}`);
    doc.moveDown();

    // Détails du prix
    doc.text('Détails du prix:');
    doc.text(`Prix total: ${reservation.montantTotal} DA`);
    doc.text(`Acompte payé: ${reservation.depositAmount} DA`);
    doc.text(`Reste à payer: ${reservation.montantTotal - reservation.depositAmount} DA`);
    doc.moveDown();

    // Statut du paiement
    doc.text(`Statut du paiement: ${reservation.statut}`);
    doc.text(`Méthode de paiement: ${reservation.paymentMethod}`);

    // Finaliser le PDF
    doc.end();

    // Attendre que le fichier soit écrit
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Mettre à jour la réservation avec l'URL de la facture
    const invoiceUrl = `/invoices/${filename}`;
    await reservation.update({ invoiceUrl });

    res.json({
      success: true,
      data: {
        invoiceUrl,
        reservation: {
          id: reservation.id,
          clientName: reservation.nomClient,
          totalPrice: reservation.montantTotal,
          depositAmount: reservation.depositAmount,
          paymentStatus: reservation.statut
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération de la facture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération de la facture'
    });
  }
};

// Obtenir l'historique des paiements
exports.getPaymentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Récupération de l\'historique des paiements pour la réservation:', id);

    const reservation = await Reservation.findByPk(id, {
      include: [
        { model: Room, attributes: ['number', 'type'] }
      ]
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Construire l'historique des paiements
    const paymentHistory = [];

    // Ajouter l'acompte s'il existe
    if (reservation.depositAmount > 0) {
      paymentHistory.push({
        type: 'DEPOSIT',
        amount: reservation.depositAmount,
        date: reservation.createdAt,
        status: 'COMPLETED',
        method: reservation.paymentMethod
      });
    }

    // Ajouter le paiement final s'il a été effectué
    if (reservation.statut === 'PAID') {
      paymentHistory.push({
        type: 'FINAL_PAYMENT',
        amount: reservation.montantTotal - reservation.depositAmount,
        date: reservation.updatedAt,
        status: 'COMPLETED',
        method: reservation.paymentMethod
      });
    }

    // Calculer les totaux
    const totalPaid = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = reservation.montantTotal - totalPaid;

    res.json({
      success: true,
      data: {
        reservationId: reservation.id,
        clientName: reservation.nomClient,
        roomNumber: reservation.Room?.number,
        totalAmount: reservation.montantTotal,
        totalPaid,
        remainingAmount,
        paymentStatus: reservation.statut,
        payments: paymentHistory
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des paiements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique des paiements'
    });
  }
};

// Calculer l'acompte pour une réservation
exports.calculateDeposit = async (req, res) => {
  try {
    const { roomId, totalPrice, checkInDate, checkOutDate } = req.body;

    // Vérifier les données requises
    if (!roomId || !totalPrice || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'Données incomplètes pour le calcul de l\'acompte'
      });
    }

    // Vérifier les dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkIn >= checkOut) {
      return res.status(400).json({
        success: false,
        message: 'La date de départ doit être postérieure à la date d\'arrivée'
      });
    }

    // Vérifier la chambre
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }

    // Calculer l'acompte
    const depositPercentage = room.type === 'STANDARD' ? 50 : 30;
    const depositAmount = Math.ceil((totalPrice * depositPercentage) / 100);

    res.json({
      success: true,
      data: {
        depositAmount,
        depositPercentage,
        remainingAmount: totalPrice - depositAmount
      }
    });
  } catch (error) {
    console.error('Erreur lors du calcul de l\'acompte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul de l\'acompte'
    });
  }
};

// Ajout d'un paiement partiel
exports.addPartialPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, paymentDate } = req.body;
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Ajouter le paiement partiel au montant existant
    const newDepositAmount = (reservation.depositAmount || 0) + amount;
    const currentDate = paymentDate || new Date().toISOString().split('T')[0];

    // Mettre à jour le statut de paiement si nécessaire
    let paymentStatus = reservation.statut;
    if (newDepositAmount >= reservation.montantTotal) {
      paymentStatus = 'PAID';
    } else if (newDepositAmount > 0) {
      paymentStatus = 'DEPOSIT_PAID';
    }

    await reservation.update({
      depositAmount: newDepositAmount,
      paymentMethod,
      paymentDate: currentDate,
      statut: paymentStatus
    });

    res.status(200).json({
      success: true,
      data: {
        depositAmount: newDepositAmount,
        paymentMethod,
        paymentDate: currentDate,
        paymentStatus
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du paiement partiel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du paiement partiel'
    });
  }
};

// Obtenir toutes les réservations d'une chambre
exports.getRoomReservations = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Vérifier si la chambre existe
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }

    // Récupérer toutes les réservations de la chambre
    const reservations = await Reservation.findAll({
      where: {
        chambreId: roomId
      },
      order: [
        ['dateCreation', 'DESC']
      ],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nom', 'prenom']
        }
      ]
    });

    // Calculer les statistiques
    const stats = {
      total: reservations.length,
      enCours: reservations.filter(r => r.statut === 'en_cours').length,
      validees: reservations.filter(r => r.statut === 'validee').length,
      terminees: reservations.filter(r => r.statut === 'terminee').length,
      annulees: reservations.filter(r => r.statut === 'annulee').length
    };

    res.status(200).json({
      success: true,
      data: {
        room: {
          id: room.id,
          number: room.number,
          type: room.type
        },
        stats,
        reservations
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations de la chambre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réservations de la chambre'
    });
  }
}; 