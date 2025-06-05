const sequelize = require('./src/config/database');
const { User, Room, Reservation } = require('./src/models');

async function initializeDatabase() {
  try {
    // Synchroniser les modèles avec la base de données
    await sequelize.sync({ force: true });
    console.log('Base de données synchronisée');

    // Créer les utilisateurs de test
    const users = [
      {
        username: 'manager1',
        password: 'manager123',
        role: 'MANAGER'
      },
      {
        username: 'receptionist1',
        password: 'reception123',
        role: 'RECEPTIONIST'
      }
    ];

    for (const userData of users) {
      await User.create(userData);
    }
    console.log('Utilisateurs de test créés');

    console.log('Initialisation terminée avec succès');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

initializeDatabase(); 