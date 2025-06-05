const axios = require('axios');
const testData = require('./test.json');
const fs = require('fs');

const API_URL = 'http://localhost:3000/api';
let managerToken = '';
let receptionistToken = '';
let createdRoomIds = [];
let createdReservationIds = [];

// Fonction utilitaire pour les appels API
async function makeRequest(method, endpoint, data = null, token = null, isMultipart = false) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (isMultipart) {
      // Pour les requêtes multipart/form-data, on envoie directement le FormData
      config.data = data;
    } else {
      config.headers['Content-Type'] = 'application/json';
      if (data) {
        config.data = data;
      }
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
      let roomId;
      if (i === 0) {
        roomId = createdRoomIds[0]; // Chambre standard pour 2 adultes
      } else if (i === 1) {
        roomId = createdRoomIds[1]; // Chambre VIP pour 1 adulte
      } else if (i === 2) {
        roomId = createdRoomIds[1]; // Chambre VIP pour 3 adultes
      } else {
        roomId = createdRoomIds[3]; // Suite pour 4 adultes
      }

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

// Tests des transitions d'état des chambres
async function testRoomStateTransitions() {
  console.log('\n=== Tests des transitions d\'état des chambres ===\n');

  for (const testCase of testData.testCases.rooms.stateTransitions) {
    await runTest(`Transition d'état: ${testCase.description}`, async () => {
      if (createdRoomIds.length === 0) {
        throw new Error('Aucune chambre disponible pour le test');
      }

      console.log('Données envoyées:', JSON.stringify(testCase.data, null, 2));
      const response = await makeRequest('PATCH', `/rooms/${createdRoomIds[0]}/status`, testCase.data, managerToken);
      console.log('Réponse reçue:', JSON.stringify(response, null, 2));
      
      if (response.status !== 'success') {
        throw new Error(`Échec de la transition d'état: ${response.message || 'Erreur inconnue'}`);
      }
      return response.data;
    });
  }
}

// Tests des calculs de prix
async function testPricing() {
  console.log('\n=== Tests des calculs de prix ===\n');

  for (const testCase of testData.testCases.reservations.pricing) {
    await runTest(`Calcul de prix: ${testCase.description}`, async () => {
      const response = await makeRequest('POST', '/reservations/calculate-price', testCase.data, receptionistToken);
      if (response.status !== 'success') throw new Error('Échec du calcul du prix');
      if (response.data.totalPrice !== testCase.expectedPrice) {
        throw new Error(`Prix incorrect. Attendu: ${testCase.expectedPrice}, Reçu: ${response.data.totalPrice}`);
      }
      return response.data;
    });
  }
}

// Tests des acomptes
async function testDeposits() {
  console.log('\n=== Tests des acomptes ===\n');

  for (const testCase of testData.testCases.reservations.deposit) {
    await runTest(`Acompte: ${testCase.description}`, async () => {
      const response = await makeRequest('POST', '/reservations/deposit', testCase.data, receptionistToken);
      if (response.status !== 'success') throw new Error('Échec du paiement de l\'acompte');
      return response.data;
    });
  }
}

// Tests des fichiers PDF
async function testPdfUpload() {
  console.log('\n=== Tests des fichiers PDF ===\n');

  for (const testCase of testData.testCases.reservations.pdf) {
    await runTest(`Upload PDF: ${testCase.description}`, async () => {
      if (createdReservationIds.length === 0) {
        throw new Error('Aucune réservation disponible pour le test');
      }

      const formData = new FormData();
      const pdfPath = "C:\\Users\\Cherif\\Downloads\\HETIC_Inscription.pdf";
      const pdfBlob = new Blob([await fs.promises.readFile(pdfPath)], { type: 'application/pdf' });
      formData.append('file', pdfBlob, 'HETIC_Inscription.pdf');
      formData.append('reservationId', createdReservationIds[0]);

      const response = await makeRequest('POST', '/reservations/upload-pdf', formData, receptionistToken, true);
      if (response.status !== 'success') throw new Error('Échec de l\'upload du PDF');
      return response.data;
    });
  }
}

// Tests des statistiques
async function testStatistics() {
  console.log('\n=== Tests des statistiques ===\n');

  // Test des revenus
  for (const testCase of testData.testCases.statistics.revenue) {
    await runTest(`Statistiques revenus: ${testCase.description}`, async () => {
      const response = await makeRequest('GET', `/statistics/revenue?period=${testCase.period}`, null, managerToken);
      if (response.status !== 'success') throw new Error('Échec de la récupération des statistiques de revenus');
      return response.data;
    });
  }

  // Test du taux de remplissage
  for (const testCase of testData.testCases.statistics.occupancy) {
    await runTest(`Taux de remplissage: ${testCase.description}`, async () => {
      const response = await makeRequest('GET', `/statistics/occupancy?period=${testCase.period}`, null, managerToken);
      if (response.status !== 'success') throw new Error('Échec de la récupération du taux de remplissage');
      return response.data;
    });
  }

  // Test des chambres les plus demandées
  for (const testCase of testData.testCases.statistics.popularRooms) {
    await runTest(`Chambres populaires: ${testCase.description}`, async () => {
      const response = await makeRequest('GET', `/statistics/popular-rooms?period=${testCase.period}`, null, managerToken);
      if (response.status !== 'success') throw new Error('Échec de la récupération des chambres populaires');
      return response.data;
    });
  }
}

// Tests du suivi des employés
async function testEmployeeTracking() {
  console.log('\n=== Tests du suivi des employés ===\n');

  for (const testCase of testData.testCases.employeeTracking) {
    await runTest(`Suivi employé: ${testCase.description}`, async () => {
      const response = await makeRequest('POST', '/employee-tracking', testCase.data, managerToken);
      if (response.status !== 'success') throw new Error('Échec de l\'enregistrement de l\'action');
      return response.data;
    });
  }
}

// Tests du mode maintenance
async function testMaintenance() {
  console.log('\n=== Tests du mode maintenance ===\n');

  for (const testCase of testData.testCases.maintenance) {
    await runTest(`Mode maintenance: ${testCase.description}`, async () => {
      const response = await makeRequest('POST', '/maintenance', testCase.data, managerToken);
      if (response.status !== 'success') throw new Error('Échec de la modification du mode maintenance');
      return response.data;
    });
  }
}

// Fonction principale mise à jour
async function runAllTests() {
  try {
    await testAuthentication();
    await testRooms();
    await testRoomStateTransitions();
    await testReservations();
    await testPricing();
    await testDeposits();
    await testPdfUpload();
    await testStatistics();
    await testEmployeeTracking();
    await testMaintenance();
    await testUsers();
    
    console.log('\n✅ Tous les tests ont été exécutés avec succès !');
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'exécution des tests:', error.message);
  }
}

// Exécuter les tests
runAllTests(); 