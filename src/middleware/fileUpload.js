const fileUpload = require('express-fileupload');

// Configuration pour les justificatifs de conventions
const conventionFileUpload = fileUpload({
  debug: true,
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  abortOnLimit: true,
  responseOnLimit: 'Fichier trop volumineux',
  safeFileNames: true,
  preserveExtension: true,
  handleErrors: true,
  checkFileType: false
});

// Configuration pour les autres types de fichiers (si nécessaire)
const generalFileUpload = fileUpload({
  debug: true,
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  abortOnLimit: true,
  responseOnLimit: 'Fichier trop volumineux',
  safeFileNames: true,
  preserveExtension: true,
  handleErrors: true,
  checkFileType: false
});

// Middleware pour valider les types de fichiers
const validateFileType = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    const file = req.files[Object.keys(req.files)[0]];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`
      });
    }

    next();
  };
};

// Types de fichiers autorisés pour les conventions
const conventionAllowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

module.exports = {
  conventionFileUpload,
  generalFileUpload,
  validateFileType,
  conventionAllowedTypes
}; 