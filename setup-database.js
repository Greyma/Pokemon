const updateDatabase = require('./update-database');
const initSupplements = require('./init-supplements');

async function setupDatabase() {
  try {
    console.log('🚀 Démarrage de la configuration de la base de données...\n');

    // Étape 1: Mettre à jour la base de données existante
    console.log('📋 Étape 1: Mise à jour de la base de données existante');
    await updateDatabase();
    console.log('');

    // Étape 2: Initialiser les suppléments
    console.log('📋 Étape 2: Initialisation des suppléments');
    await initSupplements();
    console.log('');

    console.log('🎉 Configuration de la base de données terminée avec succès !');
    console.log('');
    console.log('📝 Résumé des modifications :');
    console.log('✅ Ajout du prix par enfant aux chambres');
    console.log('✅ Ajout des nouveaux champs aux réservations');
    console.log('✅ Création de la table des suppléments');
    console.log('✅ Ajout des suppléments par défaut');
    console.log('');
    console.log('🔄 Le système est maintenant prêt à gérer :');
    console.log('   • Réservations avec adultes et enfants');
    console.log('   • Suppléments avec quantités');
    console.log('   • Activités avec quantités');
    console.log('   • Remises (pourcentage ou valeur fixe)');
    console.log('   • Calculs automatiques des prix');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration de la base de données:', error);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase; 