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

    // Initialiser les chambres
    const initializeRooms = async () => {
      try {
        const rooms = [
          // Chambres Standard
          {
            number: '101',
            type: 'STANDARD',
            capacity: 2,
            pricePerAdult: 50,
            status: 'LIBRE',
            description: 'Chambre standard confortable avec lit double',
            isActive: true
          },
          {
            number: '102',
            type: 'STANDARD',
            capacity: 2,
            pricePerAdult: 50,
            status: 'LIBRE',
            description: 'Chambre standard avec vue sur la ville',
            isActive: true
          },
          {
            number: '103',
            type: 'STANDARD',
            capacity: 3,
            pricePerAdult: 55,
            status: 'LIBRE',
            description: 'Chambre standard familiale avec lit supplémentaire',
            isActive: true
          },

          // Chambres VIP
          {
            number: '201',
            type: 'VIP',
            capacity: 2,
            pricePerAdult: 80,
            status: 'LIBRE',
            description: 'Suite VIP avec balcon privé',
            isActive: true
          },
          {
            number: '202',
            type: 'VIP',
            capacity: 2,
            pricePerAdult: 80,
            status: 'LIBRE',
            description: 'Suite VIP avec jacuzzi',
            isActive: true
          },
          {
            number: '203',
            type: 'VIP',
            capacity: 4,
            pricePerAdult: 90,
            status: 'LIBRE',
            description: 'Suite VIP familiale avec salon',
            isActive: true
          },

          // Suites
          {
            number: '301',
            type: 'SUITE',
            capacity: 2,
            pricePerAdult: 120,
            status: 'LIBRE',
            description: 'Suite de luxe avec vue panoramique',
            isActive: true
          },
          {
            number: '302',
            type: 'SUITE',
            capacity: 2,
            pricePerAdult: 120,
            status: 'LIBRE',
            description: 'Suite de luxe avec terrasse privée',
            isActive: true
          },
          {
            number: '303',
            type: 'SUITE',
            capacity: 4,
            pricePerAdult: 150,
            status: 'LIBRE',
            description: 'Suite présidentielle avec salon et salle à manger',
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