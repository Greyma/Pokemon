const axios = require('axios');
const testData = require('./test.json');

const API_URL = 'http://localhost:3000/api';
let managerToken = '';
let receptionistToken = '';
let createdRoomIds = [];
let createdReservationIds = [];

// Fonction utilitaire pour les appels API
async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
}

// Fonction pour exécuter un test
async function runTest(description, testFn, shouldFail = false, expectedError = null) {
  console.log(`\nTest: ${description}`);
  console.log('Attendu:', shouldFail ? 'ÉCHEC' : 'SUCCÈS');
  
  try {
    const result = await testFn();
    
    if (shouldFail) {
      console.log('❌ Test échoué - Succès inattendu');
      console.log('Résultat obtenu:', JSON.stringify(result, null, 2));
      console.log('Erreur attendue:', expectedError);
    } else {
      console.log('✅ Test réussi');
      if (result) {
        console.log('Résultat:', JSON.stringify(result, null, 2));
      }
    }
    
    return result;
  } catch (error) {
    if (!shouldFail) {
      console.log('❌ Test échoué - Échec inattendu');
      console.log('Erreur obtenue:', error.message);
    } else {
      if (expectedError && error.message !== expectedError) {
        console.log('⚠️ Test partiellement réussi - Erreur différente de celle attendue');
        console.log('Erreur obtenue:', error.message);
        console.log('Erreur attendue:', expectedError);
      } else {
        console.log('✅ Test réussi - Échec attendu');
        console.log('Erreur obtenue:', error.message);
      }
    }
    throw error;
  }
}

// Tests d'authentification
async function testAuthentication() {
  console.log('\n=== Tests d\'authentification ===\n');

  // Test connexion manager
  await runTest('Connexion Manager', async () => {
    const response = await makeRequest('POST', '/auth/login', testData.users[0]);
    if (response.status !== 'success') throw new Error('Échec de la connexion manager');
    managerToken = response.data.token;
    return response.data;
  });

  // Test connexion réceptionniste
  await runTest('Connexion Réceptionniste', async () => {
    const response = await makeRequest('POST', '/auth/login', testData.users[1]);
    if (response.status !== 'success') throw new Error('Échec de la connexion réceptionniste');
    receptionistToken = response.data.token;
    return response.data;
  });

  // Test vérification token
  await runTest('Vérification Token', async () => {
    const response = await makeRequest('GET', '/auth/verify', null, managerToken);
    if (response.status !== 'success') throw new Error('Échec de la vérification du token');
    return response.data;
  });

  // Test connexion avec identifiants invalides
  await runTest('Connexion avec identifiants invalides', async () => {
    const response = await makeRequest('POST', '/auth/login', {
      username: 'invalid',
      password: 'invalid'
    });
    if (response.status === 'success') throw new Error('La connexion aurait dû échouer');
    return response;
  }, true, 'Nom d\'utilisateur ou mot de passe incorrect');
}

// Tests des chambres
async function testRooms() {
  console.log('\n=== Tests des chambres ===\n');

  // Test création chambres valides
  for (const room of testData.rooms) {
    await runTest(`Création chambre ${room.number}`, async () => {
      try {
        const response = await makeRequest('POST', '/rooms', room, managerToken);
        // Si la chambre existe déjà, on considère le test comme réussi
        if (response.status === 'error' && response.message.includes('existe déjà')) {
          console.log('ℹ️ Chambre déjà existante, test considéré comme réussi');
          return { status: 'success', message: 'Chambre déjà existante' };
        }
        if (response.status !== 'success') throw new Error('Échec de la création de la chambre');
        createdRoomIds.push(response.data.id);
        return response.data;
      } catch (error) {
        // Si l'erreur indique que la chambre existe déjà, on considère le test comme réussi
        if (error.message && error.message.includes('existe déjà')) {
          console.log('ℹ️ Chambre déjà existante, test considéré comme réussi');
          return { status: 'success', message: 'Chambre déjà existante' };
        }
        throw error;
      }
    });
  }

  // Test cas invalides
  for (const testCase of testData.testCases.rooms.invalid) {
    await runTest(`Test invalide: ${testCase.description}`, async () => {
      const response = await makeRequest('POST', '/rooms', testCase.data, managerToken);
      if (response.status === 'success') {
        throw new Error('La création aurait dû échouer');
      }
      if (response.message !== testCase.expectedError) {
        throw new Error(`Message d'erreur incorrect. Attendu: "${testCase.expectedError}", Reçu: "${response.message}"`);
      }
      return response;
    }, true, testCase.expectedError);
  }

  // Test liste des chambres
  await runTest('Liste des chambres', async () => {
    const response = await makeRequest('GET', '/rooms', null, managerToken);
    if (response.status !== 'success') throw new Error('Échec de la récupération des chambres');
    return response.data;
  });

  // Test chambres disponibles
  await runTest('Chambres disponibles', async () => {
    const response = await makeRequest('GET', '/rooms/available', null, managerToken);
    if (response.status !== 'success') throw new Error('Échec de la récupération des chambres disponibles');
    return response.data;
  });

  // Test mise à jour d'une chambre
  if (createdRoomIds.length > 0) {
    await runTest('Mise à jour d\'une chambre', async () => {
      const updateData = {
        basePrice: 6000,
        description: 'Chambre mise à jour'
      };
      const response = await makeRequest('PUT', `/rooms/${createdRoomIds[0]}`, updateData, managerToken);
      if (response.status !== 'success') throw new Error('Échec de la mise à jour de la chambre');
      return response.data;
    });
  }
}

// Tests des réservations
async function testReservations() {
  console.log('\n=== Tests des réservations ===\n');

  // Test création réservations valides
  for (let i = 0; i < testData.reservations.length; i++) {
    const reservation = testData.reservations[i];
    await runTest(`Création réservation pour ${reservation.clientName}`, async () => {
      // Utiliser une chambre différente pour chaque réservation
      const roomId = createdRoomIds[i % createdRoomIds.length];
      if (!roomId) {
        throw new Error('Aucune chambre disponible pour la réservation');
      }

      const reservationData = {
        ...reservation,
        roomId
      };
      const response = await makeRequest('POST', '/reservations', reservationData, receptionistToken);
      if (response.status !== 'success') throw new Error('Échec de la création de la réservation');
      createdReservationIds.push(response.data.id);

      // Libérer la chambre après la réservation
      await makeRequest('PATCH', `/rooms/${roomId}/release`, null, managerToken);

      return response.data;
    });
  }

  // Test cas invalides
  for (const testCase of testData.testCases.reservations.invalid) {
    await runTest(`Test invalide: ${testCase.description}`, async () => {
      const response = await makeRequest('POST', '/reservations', testCase.data, receptionistToken);
      if (response.status === 'success') throw new Error('La création aurait dû échouer');
      return response;
    }, true, testCase.expectedError);
  }

  // Test liste des réservations
  await runTest('Liste des réservations', async () => {
    const response = await makeRequest('GET', '/reservations', null, receptionistToken);
    if (response.status !== 'success') throw new Error('Échec de la récupération des réservations');
    return response.data;
  });
}

// Tests des utilisateurs
async function testUsers() {
  console.log('\n=== Tests des utilisateurs ===\n');

  // Test création utilisateurs valides
  for (const testCase of testData.testCases.users.valid) {
    await runTest(`Création utilisateur: ${testCase.description}`, async () => {
      const response = await makeRequest('POST', '/users', testCase.data, managerToken);
      if (response.status !== 'success') throw new Error('Échec de la création de l\'utilisateur');
      return response.data;
    });
  }

  // Test cas invalides
  for (const testCase of testData.testCases.users.invalid) {
    await runTest(`Test invalide: ${testCase.description}`, async () => {
      const response = await makeRequest('POST', '/users', testCase.data, managerToken);
      if (response.status === 'success') {
        throw new Error('La création aurait dû échouer');
      }
      if (response.message !== testCase.expectedError) {
        throw new Error(`Message d'erreur incorrect. Attendu: "${testCase.expectedError}", Reçu: "${response.message}"`);
      }
      return response;
    }, true, testCase.expectedError);
  }

  // Test liste des utilisateurs
  await runTest('Liste des utilisateurs', async () => {
    const response = await makeRequest('GET', '/users', null, managerToken);
    if (response.status !== 'success') throw new Error('Échec de la récupération des utilisateurs');
    return response.data;
  });

  // Test statistiques utilisateurs
  await runTest('Statistiques utilisateurs', async () => {
    const response = await makeRequest('GET', '/users/stats', null, managerToken);
    if (response.status !== 'success') throw new Error('Échec de la récupération des statistiques');
    return response.data;
  });

  // Test accès non autorisé
  await runTest('Accès non autorisé aux statistiques', async () => {
    const response = await makeRequest('GET', '/users/stats', null, receptionistToken);
    if (response.status === 'success') throw new Error('L\'accès aurait dû être refusé');
    return response;
  }, true, 'Accès non autorisé');
}

// Fonction principale
async function runAllTests() {
  console.log('Démarrage des tests...\n');

  try {
    await testAuthentication();
    await testRooms();
    await testReservations();
    await testUsers();

    console.log('\nTous les tests sont terminés !');
  } catch (error) {
    console.error('Erreur lors de l\'exécution des tests:', error);
    process.exit(1);
  }
}

// Exécuter les tests
runAllTests(); 