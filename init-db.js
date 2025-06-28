const {sequelize} = require('./src/config/database');
const { User, Room, Reservation, Activity } = require('./src/models');

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

    // Initialiser les activités
    const initializeActivities = async () => {
      try {
        const activities = [
          {
            nomActivite: 'Piscine',
            prix: 1500,
            description: 'Accès à la piscine avec serviettes incluses',
            isActive: true
          },
          {
            nomActivite: 'Spa & Massage',
            prix: 5000,
            description: 'Séance de spa et massage relaxant',
            isActive: true
          },
          {
            nomActivite: 'Restaurant Gastronomique',
            prix: 3000,
            description: 'Menu gastronomique avec vue panoramique',
            isActive: true
          },
          {
            nomActivite: 'Salle de Sport',
            prix: 800,
            description: 'Accès à la salle de sport équipée',
            isActive: true
          },
          {
            nomActivite: 'Excursion Guidée',
            prix: 2500,
            description: 'Visite guidée des sites touristiques',
            isActive: true
          }
        ];

        for (const activity of activities) {
          await Activity.create(activity);
        }
        console.log('Activités initialisées avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation des activités:', error);
      }
    };

    await initializeActivities();

    console.log('Initialisation terminée avec succès');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

initializeDatabase(); 