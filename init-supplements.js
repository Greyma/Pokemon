const { sequelize } = require('./src/config/database');
const { Supplement } = require('./src/models');

async function initSupplements() {
  try {
    console.log('🔄 Initialisation des suppléments...');

    // Synchroniser le modèle Supplement
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Modèle Supplement synchronisé');

    // Vérifier si la table supplements existe
    const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='supplements'");
    
    if (results.length === 0) {
      console.log('➕ Création de la table supplements...');
      await sequelize.query(`
        CREATE TABLE supplements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nom VARCHAR(255) NOT NULL,
          prix INTEGER NOT NULL,
          isActive BOOLEAN DEFAULT 1,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL
        )
      `);
      console.log('✅ Table supplements créée');
    }

    // Suppléments par défaut
    const defaultSupplements = [
      {
        nom: 'Lit supplémentaire',
        prix: 2000,
        isActive: true
      },
      {
        nom: 'Petit déjeuner',
        prix: 1500,
        isActive: true
      },
      {
        nom: 'Dîner',
        prix: 2500,
        isActive: true
      },
      {
        nom: 'Service de chambre',
        prix: 500,
        isActive: true
      },
      {
        nom: 'WiFi premium',
        prix: 800,
        isActive: true
      },
      {
        nom: 'Parking sécurisé',
        prix: 1000,
        isActive: true
      },
      {
        nom: 'Transfert aéroport',
        prix: 3000,
        isActive: true
      },
      {
        nom: 'Nettoyage supplémentaire',
        prix: 1200,
        isActive: true
      }
    ];

    // Ajouter les suppléments par défaut
    for (const supplement of defaultSupplements) {
      const existing = await Supplement.findOne({ where: { nom: supplement.nom } });
      if (!existing) {
        await Supplement.create(supplement);
        console.log(`✅ Supplément "${supplement.nom}" ajouté`);
      } else {
        console.log(`ℹ️ Supplément "${supplement.nom}" existe déjà`);
      }
    }

    console.log('🎉 Initialisation des suppléments terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des suppléments:', error);
    console.error('Détails:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  initSupplements();
}

module.exports = initSupplements; 