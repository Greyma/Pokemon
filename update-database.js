const { sequelize } = require('./src/config/database');
const { Room, Reservation } = require('./src/models');

async function updateDatabase() {
  try {
    console.log('🔄 Mise à jour de la base de données...');

    // Synchroniser les modèles avec la base de données sans forcer les modifications
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Modèles synchronisés');

    // Vérifier si la colonne childPrice existe dans la table Rooms
    const [results] = await sequelize.query("PRAGMA table_info(Rooms)");
    const hasChildPrice = results.some(col => col.name === 'childPrice');
    
    if (!hasChildPrice) {
      console.log('➕ Ajout de la colonne childPrice à la table Rooms...');
      await sequelize.query("ALTER TABLE Rooms ADD COLUMN childPrice INTEGER DEFAULT 0");
      console.log('✅ Colonne childPrice ajoutée');
    }

    // Vérifier les nouvelles colonnes dans la table Reservations
    const [reservationColumns] = await sequelize.query("PRAGMA table_info(Reservations)");
    const columnNames = reservationColumns.map(col => col.name);
    
    const newColumns = [
      { name: 'nombreAdultes', type: 'INTEGER', defaultValue: 1 },
      { name: 'nombreEnfants', type: 'INTEGER', defaultValue: 0 },
      { name: 'suppléments', type: 'TEXT', defaultValue: '[]' },
      { name: 'remise', type: 'TEXT', defaultValue: 'null' },
      { name: 'montantRemise', type: 'DECIMAL(10,2)', defaultValue: 0 },
      { name: 'montantPaye', type: 'DECIMAL(10,2)', defaultValue: 0 },
      { name: 'methodePaiement', type: 'VARCHAR(255)', defaultValue: 'null' },
      { name: 'typeReservation', type: 'VARCHAR(255)', defaultValue: "'standard'" }
    ];

    for (const column of newColumns) {
      if (!columnNames.includes(column.name)) {
        console.log(`➕ Ajout de la colonne ${column.name} à la table Reservations...`);
        await sequelize.query(`ALTER TABLE Reservations ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.defaultValue}`);
        console.log(`✅ Colonne ${column.name} ajoutée`);
      }
    }

    // Mettre à jour les chambres existantes avec le prix par enfant
    const rooms = await Room.findAll();
    for (const room of rooms) {
      if (room.childPrice === null || room.childPrice === undefined || room.childPrice === 0) {
        // Définir un prix par enfant par défaut basé sur le type de chambre
        let defaultChildPrice = 0;
        switch (room.type) {
          case 'STANDARD':
            defaultChildPrice = Math.floor(room.basePrice * 0.3); // 30% du prix de base
            break;
          case 'VIP':
            defaultChildPrice = Math.floor(room.basePrice * 0.4); // 40% du prix de base
            break;
          case 'SUITE':
            defaultChildPrice = Math.floor(room.basePrice * 0.5); // 50% du prix de base
            break;
        }
        
        await room.update({ childPrice: defaultChildPrice });
        console.log(`✅ Chambre ${room.number} mise à jour avec prix enfant: ${defaultChildPrice}`);
      }
    }

    // Mettre à jour les réservations existantes
    const reservations = await Reservation.findAll();
    for (const reservation of reservations) {
      const updates = {};
      
      // Ajouter les nouveaux champs s'ils n'existent pas
      if (!reservation.nombreAdultes && reservation.nombrePersonnes) {
        updates.nombreAdultes = reservation.nombrePersonnes;
        updates.nombreEnfants = 0;
      }
      
      if (!reservation.suppléments || reservation.suppléments.length === 0) {
        updates.suppléments = [];
      }
      
      if (!reservation.remise) {
        updates.remise = null;
      }
      
      if (!reservation.montantRemise) {
        updates.montantRemise = 0;
      }
      
      if (!reservation.montantPaye) {
        updates.montantPaye = 0;
      }
      
      if (!reservation.methodePaiement) {
        updates.methodePaiement = null;
      }
      
      if (!reservation.typeReservation) {
        updates.typeReservation = reservation.conventionId ? 'convention' : 'standard';
      }

      if (Object.keys(updates).length > 0) {
        await reservation.update(updates);
        console.log(`✅ Réservation ${reservation.reservationId} mise à jour`);
      }
    }

    console.log('🎉 Mise à jour de la base de données terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la base de données:', error);
    console.error('Détails:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  updateDatabase();
}

module.exports = updateDatabase; 