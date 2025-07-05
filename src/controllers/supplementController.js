const { Supplement } = require('../models');

// Créer un nouveau supplément
exports.createSupplement = async (req, res) => {
  try {
    const { nom, prix } = req.body;

    // Validation des données requises
    if (!nom || prix === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Le nom et le prix sont requis'
      });
    }

    // Validation du prix
    if (prix < 0) {
      return res.status(400).json({
        success: false,
        message: 'Le prix ne peut pas être négatif'
      });
    }

    // Vérifier si le nom existe déjà
    const existingSupplement = await Supplement.findOne({ 
      where: { 
        nom: nom,
        isActive: true
      } 
    });
    
    if (existingSupplement) {
      return res.status(400).json({
        success: false,
        message: 'Un supplément avec ce nom existe déjà'
      });
    }

    // Créer le supplément
    const supplement = await Supplement.create({
      nom,
      prix,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: supplement
    });
  } catch (error) {
    console.error('Erreur lors de la création du supplément:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du supplément'
    });
  }
};

// Obtenir tous les suppléments actifs
exports.getAllSupplements = async (req, res) => {
  try {
    const supplements = await Supplement.findAll({
      where: { isActive: true },
      order: [['nom', 'ASC']]
    });

    res.json({
      success: true,
      data: supplements
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des suppléments:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des suppléments'
    });
  }
};

// Obtenir tous les suppléments (actifs et inactifs) - pour les managers
exports.getAllSupplementsAdmin = async (req, res) => {
  try {
    const supplements = await Supplement.findAll({
      order: [['nom', 'ASC']]
    });

    res.json({
      success: true,
      data: supplements
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des suppléments:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des suppléments'
    });
  }
};

// Obtenir un supplément par ID
exports.getSupplementById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplement = await Supplement.findByPk(id);

    if (!supplement) {
      return res.status(404).json({
        success: false,
        message: 'Supplément non trouvé'
      });
    }

    res.json({
      success: true,
      data: supplement
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du supplément:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du supplément'
    });
  }
};

// Mettre à jour un supplément
exports.updateSupplement = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prix } = req.body;

    const supplement = await Supplement.findByPk(id);
    if (!supplement) {
      return res.status(404).json({
        success: false,
        message: 'Supplément non trouvé'
      });
    }

    // Validation du prix
    if (prix !== undefined && prix < 0) {
      return res.status(400).json({
        success: false,
        message: 'Le prix ne peut pas être négatif'
      });
    }

    // Vérifier si le nom existe déjà (sauf pour le même supplément)
    if (nom && nom !== supplement.nom) {
      const existingSupplement = await Supplement.findOne({ 
        where: { 
          nom: nom,
          isActive: true,
          id: { [require('sequelize').Op.ne]: id }
        } 
      });
      
      if (existingSupplement) {
        return res.status(400).json({
          success: false,
          message: 'Un supplément avec ce nom existe déjà'
        });
      }
    }

    // Mettre à jour le supplément
    await supplement.update({
      nom: nom || supplement.nom,
      prix: prix !== undefined ? prix : supplement.prix
    });

    res.json({
      success: true,
      data: supplement
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du supplément:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du supplément'
    });
  }
};

// Supprimer un supplément (désactivation logique)
exports.deleteSupplement = async (req, res) => {
  try {
    const { id } = req.params;
    const supplement = await Supplement.findByPk(id);

    if (!supplement) {
      return res.status(404).json({
        success: false,
        message: 'Supplément non trouvé'
      });
    }

    // Désactivation logique
    await supplement.update({ isActive: false });

    res.json({
      success: true,
      message: 'Supplément supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du supplément:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du supplément'
    });
  }
};

// Réactiver un supplément
exports.activateSupplement = async (req, res) => {
  try {
    const { id } = req.params;
    const supplement = await Supplement.findByPk(id);

    if (!supplement) {
      return res.status(404).json({
        success: false,
        message: 'Supplément non trouvé'
      });
    }

    // Réactivation
    await supplement.update({ isActive: true });

    res.json({
      success: true,
      data: supplement
    });
  } catch (error) {
    console.error('Erreur lors de la réactivation du supplément:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réactivation du supplément'
    });
  }
}; 