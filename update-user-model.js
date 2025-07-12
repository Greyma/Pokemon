const { sequelize } = require('./src/config/database');

async function updateUserModel() {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données établie.');

    // Ajouter les nouveaux champs à la table Users
    await sequelize.query(`
      ALTER TABLE Users ADD COLUMN firstName VARCHAR(255) NOT NULL DEFAULT '';
    `);
    console.log('✅ Champ firstName ajouté');

    await sequelize.query(`
      ALTER TABLE Users ADD COLUMN lastName VARCHAR(255) NOT NULL DEFAULT '';
    `);
    console.log('✅ Champ lastName ajouté');

    await sequelize.query(`
      ALTER TABLE Users ADD COLUMN email VARCHAR(255) NOT NULL DEFAULT '';
    `);
    console.log('✅ Champ email ajouté');

    await sequelize.query(`
      ALTER TABLE Users ADD COLUMN phone VARCHAR(255);
    `);
    console.log('✅ Champ phone ajouté');

    // Mettre à jour les utilisateurs existants avec des valeurs par défaut
    await sequelize.query(`
      UPDATE Users SET 
        firstName = username,
        lastName = 'Utilisateur',
        email = CONCAT(username, '@hotel.local')
      WHERE firstName = '' OR lastName = '' OR email = '';
    `);
    console.log('✅ Utilisateurs existants mis à jour');

    console.log('🎉 Modèle User mis à jour avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du modèle User:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter la mise à jour si le fichier est appelé directement
if (require.main === module) {
  updateUserModel();
}

module.exports = { updateUserModel }; 