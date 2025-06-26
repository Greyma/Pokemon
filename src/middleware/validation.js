const { body, param, query, validationResult } = require('express-validator');

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Validation pour la création d'une convention
const validateCreateConvention = [
  body('numeroConvention')
    .notEmpty()
    .withMessage('Le numéro de convention est requis')
    .isLength({ min: 3, max: 50 })
    .withMessage('Le numéro de convention doit contenir entre 3 et 50 caractères'),
  
  body('nomSociete')
    .notEmpty()
    .withMessage('Le nom de la société est requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de la société doit contenir entre 2 et 100 caractères'),
  
  body('telephone')
    .notEmpty()
    .withMessage('Le téléphone est requis')
    .matches(/^[\+]?[0-9\s\-\(\)]{8,20}$/)
    .withMessage('Format de téléphone invalide'),
  
  body('dateDebut')
    .notEmpty()
    .withMessage('La date de début est requise')
    .isISO8601()
    .withMessage('Format de date invalide'),
  
  body('dateFin')
    .notEmpty()
    .withMessage('La date de fin est requise')
    .isISO8601()
    .withMessage('Format de date invalide'),
  
  body('prixConvention')
    .notEmpty()
    .withMessage('Le prix de la convention est requis')
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif'),
  
  // Validation des chambres par type
  body('chambresStandard')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Le nombre de chambres standard doit être entre 0 et 50'),
  
  body('chambresVIP')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Le nombre de chambres VIP doit être entre 0 et 20'),
  
  body('chambresSuite')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Le nombre de chambres suite doit être entre 0 et 10'),
  
  body('nombreAdultesMaxParChambre')
    .notEmpty()
    .withMessage('Le nombre d\'adultes maximum par chambre est requis')
    .isInt({ min: 1, max: 4 })
    .withMessage('Le nombre d\'adultes maximum par chambre doit être entre 1 et 4'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Format d\'email invalide'),
  
  body('adresse')
    .optional()
    .isLength({ max: 500 })
    .withMessage('L\'adresse ne peut pas dépasser 500 caractères'),
  
  body('contactPrincipal')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le contact principal doit contenir entre 2 et 100 caractères'),
  
  body('conditionsSpeciales')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Les conditions spéciales ne peuvent pas dépasser 1000 caractères'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('La description ne peut pas dépasser 2000 caractères'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Les notes ne peuvent pas dépasser 1000 caractères'),
  
  // Validation personnalisée pour s'assurer qu'au moins une chambre est configurée
  body().custom((value) => {
    const totalChambres = (value.chambresStandard || 0) + (value.chambresVIP || 0) + (value.chambresSuite || 0);
    if (totalChambres === 0) {
      throw new Error('Au moins une chambre doit être configurée pour la convention');
    }
    return true;
  }),
  
  handleValidationErrors
];

// Validation pour la modification d'une convention
const validateUpdateConvention = [
  param('id')
    .isUUID()
    .withMessage('ID de convention invalide'),
  
  body('numeroConvention')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Le numéro de convention doit contenir entre 3 et 50 caractères'),
  
  body('nomSociete')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de la société doit contenir entre 2 et 100 caractères'),
  
  body('telephone')
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]{8,20}$/)
    .withMessage('Format de téléphone invalide'),
  
  body('dateDebut')
    .optional()
    .isISO8601()
    .withMessage('Format de date invalide'),
  
  body('dateFin')
    .optional()
    .isISO8601()
    .withMessage('Format de date invalide'),
  
  body('prixConvention')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif'),
  
  // Validation des chambres par type
  body('chambresStandard')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Le nombre de chambres standard doit être entre 0 et 50'),
  
  body('chambresVIP')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Le nombre de chambres VIP doit être entre 0 et 20'),
  
  body('chambresSuite')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Le nombre de chambres suite doit être entre 0 et 10'),
  
  body('nombreAdultesMaxParChambre')
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage('Le nombre d\'adultes maximum par chambre doit être entre 1 et 4'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Format d\'email invalide'),
  
  body('adresse')
    .optional()
    .isLength({ max: 500 })
    .withMessage('L\'adresse ne peut pas dépasser 500 caractères'),
  
  body('contactPrincipal')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le contact principal doit contenir entre 2 et 100 caractères'),
  
  body('conditionsSpeciales')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Les conditions spéciales ne peuvent pas dépasser 1000 caractères'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('La description ne peut pas dépasser 2000 caractères'),
  
  body('statut')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'EXPIRED'])
    .withMessage('Statut invalide'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Les notes ne peuvent pas dépasser 1000 caractères'),
  
  handleValidationErrors
];

// Validation pour les paramètres de requête
const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
  
  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('La recherche doit contenir entre 2 et 100 caractères'),
  
  query('statut')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'EXPIRED'])
    .withMessage('Statut invalide'),
  
  query('dateDebut')
    .optional()
    .isISO8601()
    .withMessage('Format de date de début invalide'),
  
  query('dateFin')
    .optional()
    .isISO8601()
    .withMessage('Format de date de fin invalide'),
  
  handleValidationErrors
];

// Validation pour les paramètres d'ID
const validateId = [
  param('id')
    .isUUID()
    .withMessage('ID invalide'),
  
  handleValidationErrors
];

// Validation pour la recherche par société
const validateSearchBySociete = [
  query('nomSociete')
    .notEmpty()
    .withMessage('Le nom de la société est requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de la société doit contenir entre 2 et 100 caractères'),
  
  handleValidationErrors
];

// Validation pour la vérification de disponibilité
const validateVerificationDisponibilite = [
  body('dateDebut')
    .notEmpty()
    .withMessage('La date de début est requise')
    .isISO8601()
    .withMessage('Format de date invalide'),
  
  body('dateFin')
    .notEmpty()
    .withMessage('La date de fin est requise')
    .isISO8601()
    .withMessage('Format de date invalide'),
  
  body('chambresStandard')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Le nombre de chambres standard doit être entre 0 et 50'),
  
  body('chambresVIP')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Le nombre de chambres VIP doit être entre 0 et 20'),
  
  body('chambresSuite')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Le nombre de chambres suite doit être entre 0 et 10'),
  
  // Validation personnalisée pour s'assurer qu'au moins une chambre est configurée
  body().custom((value) => {
    const totalChambres = (value.chambresStandard || 0) + (value.chambresVIP || 0) + (value.chambresSuite || 0);
    if (totalChambres === 0) {
      throw new Error('Au moins une chambre doit être configurée');
    }
    return true;
  }),
  
  handleValidationErrors
];

// Validation pour la recherche de dates disponibles
const validateRechercheDatesDisponibles = [
  body('dateDebut')
    .notEmpty()
    .withMessage('La date de début est requise')
    .isISO8601()
    .withMessage('Format de date invalide'),
  
  body('nombreJours')
    .notEmpty()
    .withMessage('Le nombre de jours est requis')
    .isInt({ min: 1, max: 365 })
    .withMessage('Le nombre de jours doit être entre 1 et 365'),
  
  body('chambresStandard')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Le nombre de chambres standard doit être entre 0 et 50'),
  
  body('chambresVIP')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Le nombre de chambres VIP doit être entre 0 et 20'),
  
  body('chambresSuite')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Le nombre de chambres suite doit être entre 0 et 10'),
  
  body('dateFinMax')
    .optional()
    .isISO8601()
    .withMessage('Format de date de fin maximale invalide'),
  
  // Validation personnalisée pour s'assurer qu'au moins une chambre est configurée
  body().custom((value) => {
    const totalChambres = (value.chambresStandard || 0) + (value.chambresVIP || 0) + (value.chambresSuite || 0);
    if (totalChambres === 0) {
      throw new Error('Au moins une chambre doit être configurée');
    }
    return true;
  }),
  
  handleValidationErrors
];

// Validation pour la recherche de dates disponibles par nombre total
const validateRechercheDatesDisponiblesParNombreTotal = [
  body('dateDebut')
    .notEmpty()
    .withMessage('La date de début est requise')
    .isISO8601()
    .withMessage('Format de date invalide'),
  
  body('dateFin')
    .notEmpty()
    .withMessage('La date de fin est requise')
    .isISO8601()
    .withMessage('Format de date de fin invalide'),
  
  body('nombreJours')
    .notEmpty()
    .withMessage('Le nombre de jours est requis')
    .isInt({ min: 1, max: 365 })
    .withMessage('Le nombre de jours doit être entre 1 et 365'),
  
  body('nombreChambresTotal')
    .notEmpty()
    .withMessage('Le nombre de chambres total est requis')
    .isInt({ min: 1, max: 100 })
    .withMessage('Le nombre de chambres total doit être entre 1 et 100'),
  
  // Validation personnalisée pour s'assurer que dateFin est postérieure à dateDebut
  body().custom((value) => {
    if (value.dateFin && value.dateDebut) {
      const dateDebut = new Date(value.dateDebut);
      const dateFin = new Date(value.dateFin);
      if (dateFin <= dateDebut) {
        throw new Error('La date de fin doit être postérieure à la date de début');
      }
    }
    return true;
  }),
  
  handleValidationErrors
];

module.exports = {
  validateCreateConvention,
  validateUpdateConvention,
  validateQueryParams,
  validateId,
  validateSearchBySociete,
  validateVerificationDisponibilite,
  validateRechercheDatesDisponibles,
  validateRechercheDatesDisponiblesParNombreTotal,
  handleValidationErrors
}; 