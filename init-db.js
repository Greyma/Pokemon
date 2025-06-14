const {sequelize} = require('./src/config/database');
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

    // Initialiser les chambres
    const initializeRooms = async () => {
      try {
        const rooms = [
          // Chambres Standard
          {
            number: '45185',
            type: 'STANDARD',
            capacity: 2,
            basePrice: 50,
            extraPersonPrice: 25,
            status: 'LIBRE',
            description: 'Chambre standard confortable avec lit double',
            isActive: true
          },
          {
            number: '45186',
            type: 'STANDARD',
            capacity: 2,
            basePrice: 50,
            extraPersonPrice: 25,
            status: 'LIBRE',
            description: 'Chambre standard avec vue sur la ville',
            isActive: true
          },
          {
            number: '45188',
            type: 'STANDARD',
            capacity: 3,
            basePrice: 55,
            extraPersonPrice: 30,
            status: 'LIBRE',
            description: 'Chambre standard familiale avec lit supplémentaire',
            isActive: true
          },

          // Chambres VIP
          {
            number: '45187',
            type: 'VIP',
            capacity: 2,
            basePrice: 80,
            extraPersonPrice: 40,
            status: 'LIBRE',
            description: 'Suite VIP avec balcon privé',
            isActive: true
          }
        ];

        for (const room of rooms) {
          await Room.create(room);
        }
        console.log('Chambres initialisées avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation des chambres:', error);
      }
    };

    await initializeRooms();

    console.log('Initialisation terminée avec succès');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

initializeDatabase(); 