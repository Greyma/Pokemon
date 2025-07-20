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
        firstName: 'Manager',
        lastName: 'Principal',
        email: 'manager1@hotel.local',
        role: 'MANAGER',
        isActive: true
      },
      {
        username: 'receptionist1',
        password: 'reception123',
        firstName: 'Réceptionniste',
        lastName: 'Principal',
        email: 'receptionist1@hotel.local',
        role: 'RECEPTIONIST',
        isActive: true
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`Utilisateur créé: ${user.username} (ID: ${user.id})`);
    }
    console.log('Utilisateurs de test créés');

  //   // Initialiser les chambres
  //   const initializeRooms = async () => {
  //     const rooms = [];
      
  //     // Chambres STANDARD (101-120)
  //     for (let i = 101; i <= 120; i++) {
  //       rooms.push({
  //         number: i.toString(),
  //         type: 'STANDARD',
  //         basePrice: 5000,
  //         extraPersonPrice: 1000,
  //         childPrice: 500,
  //         capacity: 2,
  //         description: 'Chambre standard confortable',
  //         isActive: true,
  //         status: 'LIBRE'
  //       });
  //     }
      
  //     // Chambres VIP (201-210)
  //     for (let i = 201; i <= 210; i++) {
  //       rooms.push({
  //         number: i.toString(),
  //         type: 'VIP',
  //         basePrice: 8000,
  //         extraPersonPrice: 1500,
  //         childPrice: 800,
  //         capacity: 3,
  //         description: 'Chambre VIP avec services premium',
  //         isActive: true,
  //         status: 'LIBRE'
  //       });
  //     }
      
  //     // Chambres SUITE (301-305)
  //     for (let i = 301; i <= 305; i++) {
  //       rooms.push({
  //         number: i.toString(),
  //         type: 'SUITE',
  //         basePrice: 12000,
  //         extraPersonPrice: 2000,
  //         childPrice: 1200,
  //         capacity: 4,
  //         description: 'Suite luxueuse avec vue panoramique',
  //         isActive: true,
  //         status: 'LIBRE'
  //       });
  //     }
      
  //     return rooms;
  //   };

  //   const rooms = await initializeRooms();
  //   await Room.bulkCreate(rooms);
  //   console.log(`${rooms.length} chambres créées`);

  //   // Créer quelques activités de test
  //   const activities = [
  //     {
  //       nomActivite: 'Piscine',
  //       prix: 1500,
  //       description: 'Accès à la piscine avec serviettes incluses',
  //       isActive: true
  //     },
  //     {
  //       nomActivite: 'Spa & Massage',
  //       prix: 5000,
  //       description: 'Séance de spa et massage relaxant',
  //       isActive: true
  //     },
  //     {
  //       nomActivite: 'Restaurant',
  //       prix: 2500,
  //       description: 'Repas au restaurant de l\'hôtel',
  //       isActive: true
  //     }
  //   ];

  //   await Activity.bulkCreate(activities);
  //   console.log(`${activities.length} activités créées`);

  //   console.log('\n✅ Base de données initialisée avec succès !');
  //   console.log('\n📋 Informations de connexion :');
  //   console.log('👨‍💼 Manager:');
  //   console.log('   Username: manager1');
  //   console.log('   Password: manager123');
  //   console.log('   ID:', createdUsers.find(u => u.role === 'MANAGER').id);
  //   console.log('\n👩‍💼 Réceptionniste:');
  //   console.log('   Username: receptionist1');
  //   console.log('   Password: reception123');
  //   console.log('   ID:', createdUsers.find(u => u.role === 'RECEPTIONIST').id);

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
   } finally {
     await sequelize.close();
   }
}

async function cleanDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données établie.');

    // Supprimer les utilisateurs avec username null
    const deletedCount = await User.destroy({
      where: {
        username: null
      }
    });
    
    console.log(`${deletedCount} utilisateurs avec username null ont été supprimés.`);

    // Vérifier s'il reste des doublons
    const users = await User.findAll({
      attributes: ['username'],
      where: {
        username: {
          [sequelize.Op.ne]: null
        }
      }
    });

    const usernames = users.map(u => u.username);
    const duplicates = usernames.filter((item, index) => usernames.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
      console.log('⚠️  Usernames en double trouvés:', [...new Set(duplicates)]);
    } else {
      console.log('✅ Aucun username en double trouvé.');
    }

    await sequelize.close();
    console.log('Base de données nettoyée avec succès.');
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
  }
}

// Exécuter l'initialisation si le fichier est appelé directement
if (require.main === module) {
  (async () => {
    await initializeDatabase();
    await cleanDatabase();
  })();
}

module.exports = { initializeDatabase }; 