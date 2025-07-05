const { Supplement, Activity } = require('../models');

/**
 * Calcule le prix total d'une réservation
 * @param {Object} params - Paramètres de calcul
 * @returns {Object} - Détails du calcul
 */
async function calculateReservationPrice(params) {
  const {
    roomId,
    checkInDate,
    checkOutDate,
    numberOfAdults,
    numberOfChildren = 0,
    supplements = [],
    activities = [],
    discount = null,
    conventionId = null
  } = params;

  // Calculer le nombre de nuits
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  // Prix de base de la chambre
  let roomPrice = 0;
  let roomDetails = {};

  if (roomId) {
    const { Room } = require('../models');
    const room = await Room.findByPk(roomId);
    
    if (room) {
      const basePrice = room.basePrice * nights;
      const extraAdults = Math.max(0, numberOfAdults - room.capacity);
      const extraAdultsPrice = extraAdults * room.extraPersonPrice * nights;
      const childrenPrice = numberOfChildren * room.childPrice * nights;
      
      roomPrice = basePrice + extraAdultsPrice + childrenPrice;
      
      roomDetails = {
        basePrice: room.basePrice,
        extraPersonPrice: room.extraPersonPrice,
        childPrice: room.childPrice,
        capacity: room.capacity,
        nights,
        numberOfAdults,
        numberOfChildren,
        extraAdults,
        basePriceTotal: basePrice,
        extraAdultsPrice,
        childrenPrice
      };
    }
  }

  // Calculer le prix des suppléments
  let supplementsPrice = 0;
  let supplementsDetails = [];

  if (supplements && supplements.length > 0) {
    for (const supplement of supplements) {
      if (supplement.id && supplement.quantite) {
        const supplementData = await Supplement.findByPk(supplement.id);
        if (supplementData && supplementData.isActive) {
          const supplementTotal = supplementData.prix * supplement.quantite;
          supplementsPrice += supplementTotal;
          
          supplementsDetails.push({
            id: supplementData.id,
            nom: supplementData.nom,
            prix: supplementData.prix,
            quantite: supplement.quantite,
            total: supplementTotal
          });
        }
      }
    }
  }

  // Calculer le prix des activités
  let activitiesPrice = 0;
  let activitiesDetails = [];

  if (activities && activities.length > 0) {
    for (const activity of activities) {
      if (activity.id && activity.quantite) {
        const activityData = await Activity.findByPk(activity.id);
        if (activityData && activityData.isActive) {
          const activityTotal = activityData.prix * activity.quantite;
          activitiesPrice += activityTotal;
          
          activitiesDetails.push({
            id: activityData.id,
            nomActivite: activityData.nomActivite,
            prix: activityData.prix,
            quantite: activity.quantite,
            total: activityTotal
          });
        }
      }
    }
  }

  // Calculer le sous-total
  const subtotal = roomPrice + supplementsPrice + activitiesPrice;

  // Calculer la remise
  let discountAmount = 0;
  let discountDetails = null;

  if (discount && (discount.type === 'pourcentage' || discount.type === 'valeur')) {
    if (discount.type === 'pourcentage') {
      discountAmount = (subtotal * discount.valeur) / 100;
    } else {
      discountAmount = Math.min(discount.valeur, subtotal);
    }
    
    discountDetails = {
      type: discount.type,
      valeur: discount.valeur,
      montant: discountAmount
    };
  }

  // Calculer le total final
  const totalPrice = subtotal - discountAmount;

  return {
    totalPrice,
    subtotal,
    discountAmount,
    priceDetails: {
      room: roomDetails,
      supplements: {
        total: supplementsPrice,
        items: supplementsDetails
      },
      activities: {
        total: activitiesPrice,
        items: activitiesDetails
      },
      discount: discountDetails,
      summary: {
        roomPrice,
        supplementsPrice,
        activitiesPrice,
        subtotal,
        discountAmount,
        totalPrice,
        nights,
        numberOfAdults,
        numberOfChildren
      }
    }
  };
}

/**
 * Valide les suppléments
 * @param {Array} supplements - Liste des suppléments
 * @returns {Object} - Résultat de la validation
 */
async function validateSupplements(supplements) {
  if (!supplements || !Array.isArray(supplements)) {
    return { valid: true, supplements: [] };
  }

  const validatedSupplements = [];
  
  for (const supplement of supplements) {
    if (!supplement.id || !supplement.quantite || supplement.quantite <= 0) {
      return {
        valid: false,
        error: 'Données de supplément incomplètes ou invalides'
      };
    }

    const supplementData = await Supplement.findByPk(supplement.id);
    if (!supplementData) {
      return {
        valid: false,
        error: `Supplément avec l'ID ${supplement.id} non trouvé`
      };
    }

    if (!supplementData.isActive) {
      return {
        valid: false,
        error: `Le supplément "${supplementData.nom}" n'est pas actif`
      };
    }

    validatedSupplements.push({
      id: supplementData.id,
      nom: supplementData.nom,
      prix: supplementData.prix,
      quantite: supplement.quantite
    });
  }

  return { valid: true, supplements: validatedSupplements };
}

/**
 * Valide les activités
 * @param {Array} activities - Liste des activités
 * @returns {Object} - Résultat de la validation
 */
async function validateActivities(activities) {
  if (!activities || !Array.isArray(activities)) {
    return { valid: true, activities: [] };
  }

  const validatedActivities = [];
  
  for (const activity of activities) {
    if (!activity.id || !activity.quantite || activity.quantite <= 0) {
      return {
        valid: false,
        error: 'Données d\'activité incomplètes ou invalides'
      };
    }

    const activityData = await Activity.findByPk(activity.id);
    if (!activityData) {
      return {
        valid: false,
        error: `Activité avec l'ID ${activity.id} non trouvée`
      };
    }

    if (!activityData.isActive) {
      return {
        valid: false,
        error: `L'activité "${activityData.nomActivite}" n'est pas active`
      };
    }

    validatedActivities.push({
      id: activityData.id,
      nomActivite: activityData.nomActivite,
      prix: activityData.prix,
      quantite: activity.quantite
    });
  }

  return { valid: true, activities: validatedActivities };
}

/**
 * Valide la remise
 * @param {Object} discount - Informations sur la remise
 * @returns {Object} - Résultat de la validation
 */
function validateDiscount(discount) {
  if (!discount) {
    return { valid: true, discount: null };
  }

  if (!discount.type || !['pourcentage', 'valeur'].includes(discount.type)) {
    return {
      valid: false,
      error: 'Type de remise invalide (doit être "pourcentage" ou "valeur")'
    };
  }

  if (!discount.valeur || discount.valeur < 0) {
    return {
      valid: false,
      error: 'Valeur de remise invalide'
    };
  }

  if (discount.type === 'pourcentage' && discount.valeur > 100) {
    return {
      valid: false,
      error: 'Le pourcentage de remise ne peut pas dépasser 100%'
    };
  }

  return { valid: true, discount };
}

module.exports = {
  calculateReservationPrice,
  validateSupplements,
  validateActivities,
  validateDiscount
}; 