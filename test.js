const axios = require('axios');
const testData = require('./test.json');
const request = require('supertest');
const app = require('./src/index');

const API_URL = 'http://localhost:3001/api';
let authToken = null;
let createdRoomId = null;
let createdReservationId = null;

// Configuration d'axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Fonction pour ajouter le token d'authentification
const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Tests d'authentification
describe('Tests d\'authentification', () => {
  test('Connexion réussie d\'un réceptionniste', async () => {
    const response = await api.post('/auth/login', {
      username: testData.users[1].username,
      password: testData.users[1].password
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('token');
    authToken = response.data.data.token;
    setAuthToken(authToken);
  });

  test('Connexion échouée avec mauvais mot de passe', async () => {
    try {
      await api.post('/auth/login', {
        username: testData.users[1].username,
        password: 'mauvais_mot_de_passe'
      });
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });
});

// Tests de gestion des chambres
describe('Tests de gestion des chambres', () => {
  let token;

  beforeAll(async () => {
    // Authentification en tant que manager
    const loginResponse = await api.post('/auth/login', {
      username: 'manager1',
      password: 'manager123'
    });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.data.data).toHaveProperty('token');
    token = loginResponse.data.data.token;
    setAuthToken(token);
  });

  test('Création d\'une nouvelle chambre', async () => {
    // Vérification que nous sommes bien authentifiés
    expect(token).toBeDefined();
    
    const newRoom = {
      number: '801',
      type: 'STANDARD',
      basePrice: 15000,
      extraPersonPrice: 2500,
      capacity: 2,
      description: 'Chambre standard pour tests'
    };

    const response = await api.post('/rooms', newRoom);
    expect(response.status).toBe(201);
    expect(response.data.data).toHaveProperty('id');
    expect(response.data.data).toHaveProperty('number', newRoom.number);
    expect(response.data.data).toHaveProperty('type', newRoom.type);
    expect(response.data.data).toHaveProperty('basePrice', newRoom.basePrice);
    expect(response.data.data).toHaveProperty('extraPersonPrice', newRoom.extraPersonPrice);
    expect(response.data.data).toHaveProperty('capacity', newRoom.capacity);
    expect(response.data.data).toHaveProperty('status', 'LIBRE');
    createdRoomId = response.data.data.id;
  });

  test('Modification d\'une chambre existante', async () => {
    const roomId = createdRoomId;
    const updateData = {
      basePrice: 16000,
      extraPersonPrice: 3000,
      description: 'Chambre mise à jour'
    };

    const response = await api.put(`/rooms/${roomId}`, updateData);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('basePrice', updateData.basePrice);
    expect(response.data.data).toHaveProperty('extraPersonPrice', updateData.extraPersonPrice);
    expect(response.data.data).toHaveProperty('description', updateData.description);
  });

  test('Désactivation d\'une chambre', async () => {
    const roomId = createdRoomId;
    const response = await api.patch(`/rooms/${roomId}/status`, {
      isActive: false
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('isActive', false);
  });
});

// Tests des réservations
describe('Tests de gestion des réservations', () => {
  let token;
  let roomId;
  let receptionistId;

  beforeAll(async () => {
    // Se connecter en tant que réceptionniste pour les opérations sur les réservations
    const receptionistResponse = await api.post('/auth/login', {
      username: testData.users[1].username,
      password: testData.users[1].password
    });
    expect(receptionistResponse.status).toBe(200);
    expect(receptionistResponse.data.data).toHaveProperty('token');
    expect(receptionistResponse.data.data).toHaveProperty('user');
    expect(receptionistResponse.data.data.user).toHaveProperty('id');
    token = receptionistResponse.data.data.token;
    receptionistId = receptionistResponse.data.data.user.id;
    setAuthToken(token);
  });

  beforeEach(async () => {
    // Se connecter en tant que manager pour créer une nouvelle chambre
    const managerResponse = await api.post('/auth/login', {
      username: 'manager1',
      password: 'manager123'
    });
    expect(managerResponse.status).toBe(200);
    expect(managerResponse.data.data).toHaveProperty('token');
    const managerToken = managerResponse.data.data.token;
    setAuthToken(managerToken);

    // Créer une nouvelle chambre pour le test avec un numéro unique
    const uniqueNumber = `TEST${Date.now()}`;
    const roomResponse = await api.post('/rooms', {
      number: uniqueNumber,
      type: 'STANDARD',
      basePrice: 10000,
      extraPersonPrice: 2000,
      capacity: 2,
      description: 'Chambre standard pour tests de réservation'
    });
    expect(roomResponse.status).toBe(201);
    roomId = roomResponse.data.data.id;
    console.log('Nouvelle chambre créée avec ID:', roomId);

    // Revenir au token du réceptionniste
    setAuthToken(token);
  });

  test('Création d\'une nouvelle réservation', async () => {
    // Vérifier que nous avons bien l'ID du réceptionniste
    expect(receptionistId).toBeDefined();
    expect(typeof receptionistId).toBe('string');

    const newReservation = {
      clientName: 'Ahmed Benali',
      clientType: 'PRESENTIEL',
      numberOfAdults: 2,
      numberOfChildren: 2,
      checkInDate: '2025-06-08',
      checkOutDate: '2025-06-11',
      paymentMethod: 'CASH',
      paymentStatus: 'PENDING',
      specialRequests: 'Test',
      contactPhone: '+213555000001',
      contactEmail: 'test@email.com',
      roomId: roomId,
      createdBy: receptionistId,
      createdByUsername: testData.users[1].username
    };

    // Vérifier que createdBy est bien défini avant l'envoi
    expect(newReservation.createdBy).toBeDefined();
    expect(newReservation.createdBy).toBe(receptionistId);

    const response = await api.post('/reservations', newReservation);
    expect(response.status).toBe(201);
    expect(response.data.data.reservation).toHaveProperty('clientName', newReservation.clientName);
    expect(response.data.data.reservation).toHaveProperty('numberOfChildren', 2);
    expect(response.data.data.reservation).toHaveProperty('createdByUsername');
    expect(response.data.data.reservation).toHaveProperty('clientType', 'PRESENTIEL');
    expect(response.data.data.reservation).toHaveProperty('paymentMethod', 'CASH');
    expect(response.data.data.reservation).toHaveProperty('contactPhone', '+213555000001');
    expect(response.data.data.reservation).toHaveProperty('contactEmail', 'test@email.com');
    expect(response.data.data.reservation).toHaveProperty('specialRequests', 'Test');
    expect(response.data.data.reservation).toHaveProperty('totalPrice', 30000);
    expect(response.data.data.reservation).toHaveProperty('roomId', roomId);
    expect(response.data.data.reservation).toHaveProperty('createdBy', receptionistId);
    createdReservationId = response.data.data.reservation.id;
  });

  test('Récupération de toutes les réservations', async () => {
    const response = await api.get('/reservations');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data.data)).toBe(true);
    if (response.data.data.length > 0) {
      expect(response.data.data[0]).toHaveProperty('clientName');
      expect(response.data.data[0]).toHaveProperty('contactPhone');
      expect(response.data.data[0]).toHaveProperty('contactEmail');
      expect(response.data.data[0]).toHaveProperty('numberOfAdults');
      expect(response.data.data[0]).toHaveProperty('numberOfChildren');
      expect(response.data.data[0]).toHaveProperty('createdByUsername');
    }
  });

  test('Récupération d\'une réservation spécifique', async () => {
    const response = await api.get(`/reservations/${createdReservationId}`);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('id', createdReservationId);
    expect(response.data.data).toHaveProperty('clientName');
    expect(response.data.data).toHaveProperty('contactPhone');
    expect(response.data.data).toHaveProperty('contactEmail');
    expect(response.data.data).toHaveProperty('numberOfAdults');
    expect(response.data.data).toHaveProperty('numberOfChildren');
    expect(response.data.data).toHaveProperty('createdByUsername');
  });

  test('Mise à jour du statut de paiement', async () => {
    const updateData = {
      paymentStatus: 'COMPLETED',
      paymentMethod: 'CASH',
      amount: 20000
    };
    const response = await api.patch(`/reservations/${createdReservationId}/payment`, updateData);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('paymentStatus', 'COMPLETED');
    expect(response.data.data).toHaveProperty('paymentMethod', 'CASH');
    expect(response.data.data).toHaveProperty('totalPaid', 20000);
  });

  test('Ajout d\'un paiement partiel', async () => {
    const response = await api.post(`/reservations/${createdReservationId}/partial-payment`, {
      amount: 1000,
      paymentMethod: 'CASH',
      paymentDate: new Date().toISOString().split('T')[0]
    });
    expect(response.status).toBe(200);
    expect(response.data.data.depositAmount).toBeGreaterThanOrEqual(1000);
    expect(response.data.data.paymentMethod).toBe('CASH');
    expect(response.data.data.paymentDate).toBeDefined();
  });

  test('Ajout de plusieurs paiements partiels', async () => {
    await api.post(`/reservations/${createdReservationId}/partial-payment`, { 
      amount: 1000, 
      paymentMethod: 'CASH',
      paymentDate: new Date().toISOString().split('T')[0]
    });
    const response = await api.post(`/reservations/${createdReservationId}/partial-payment`, { 
      amount: 1000, 
      paymentMethod: 'CASH',
      paymentDate: new Date().toISOString().split('T')[0]
    });
    expect(response.status).toBe(200);
    expect(response.data.data.depositAmount).toBeGreaterThanOrEqual(2000);
    expect(response.data.data.paymentMethod).toBe('CASH');
    expect(response.data.data.paymentDate).toBeDefined();
  });

  test('Création d\'une réservation avec paiement complet', async () => {
    // Vérifier que roomId est défini
    expect(roomId).toBeDefined();
    console.log('ID de la chambre à utiliser:', roomId);

    const reservationData = {
      ...testData.reservations[0],
      roomId: roomId,
      depositAmount: 20000,
      totalPrice: 20000,
      numberOfChildren: 1,
      clientType: 'PRESENTIEL',
      paymentMethod: 'CASH',
      contactPhone: '+213555000002',
      contactEmail: 'test2@email.com',
      specialRequests: 'Test paiement complet'
    };

    console.log('Données de réservation:', reservationData);

    const response = await api.post('/reservations', reservationData);
    expect(response.status).toBe(201);
    expect(response.data.data.reservation.paymentStatus).toBe('PAID');
    expect(response.data.data.reservation.numberOfChildren).toBe(1);
    expect(response.data.data.reservation.clientType).toBe('PRESENTIEL');
    expect(response.data.data.reservation.paymentMethod).toBe('CASH');
    expect(response.data.data.reservation.contactPhone).toBe('+213555000002');
    expect(response.data.data.reservation.contactEmail).toBe('test2@email.com');
    expect(response.data.data.reservation.specialRequests).toBe('Test paiement complet');
  });

  test('Calcul du prix d\'une réservation', async () => {
    const priceData = {
      checkInDate: testData.reservations[0].checkInDate,
      checkOutDate: testData.reservations[0].checkOutDate,
      roomId: createdRoomId,
      numberOfAdults: testData.reservations[0].numberOfAdults
    };
    const response = await api.post('/reservations/calculate-price', priceData);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('totalPrice');
    expect(response.data.data).toHaveProperty('priceDetails');
  });

  test('Récupération des chambres disponibles', async () => {
    const checkInDate = testData.reservations[0].checkInDate;
    const checkOutDate = testData.reservations[0].checkOutDate;
    const response = await api.get('/rooms/available', {
      params: {
        checkInDate,
        checkOutDate,
        roomType: 'STANDARD'
      }
    });
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(response.data.data[0]).toHaveProperty('number');
    expect(response.data.data[0]).toHaveProperty('type');
    expect(response.data.data[0]).toHaveProperty('status');
  });
});

// // Tests supplémentaires des réservations
// describe('Tests supplémentaires des réservations', () => {
//   beforeAll(async () => {
//     const response = await api.post('/auth/login', {
//       username: testData.users[1].username,
//       password: testData.users[1].password
//     });
//     authToken = response.data.data.token;
//     setAuthToken(authToken);
//   });

//   test('Création d\'une réservation garantie par manager', async () => {
//     const newReservation = {
//       ...testData.testCases.reservations.valid[1].data,
//       roomId: createdRoomId,
//       numberOfChildren: 2,
//       clientType: 'PRESENTIEL',
//       paymentMethod: 'CASH',
//       contactPhone: '+213555000003',
//       contactEmail: 'test3@email.com',
//       specialRequests: 'Test garantie manager',
//       totalPrice: 20000
//     };
//     const response = await api.post('/reservations', newReservation);
//     expect(response.status).toBe(201);
//     expect(response.data.data.reservation).toHaveProperty('guaranteedBy', 'manager1');
//     expect(response.data.data.reservation).toHaveProperty('numberOfChildren', 2);
//     expect(response.data.data.reservation).toHaveProperty('clientType', 'PRESENTIEL');
//     expect(response.data.data.reservation).toHaveProperty('paymentMethod', 'CASH');
//     expect(response.data.data.reservation).toHaveProperty('contactPhone', '+213555000003');
//     expect(response.data.data.reservation).toHaveProperty('contactEmail', 'test3@email.com');
//     expect(response.data.data.reservation).toHaveProperty('specialRequests', 'Test garantie manager');
//     expect(response.data.data.reservation).toHaveProperty('totalPrice', 20000);
//   });

//   test('Création d\'une réservation avec acompte', async () => {
//     const newReservation = {
//       ...testData.testCases.reservations.valid[2].data,
//       roomId: createdRoomId,
//       depositAmount: 5000,
//       paymentMethod: 'CCP',
//       paymentStatus: 'PENDING',
//       checkInDate: '2025-08-01',
//       checkOutDate: '2025-08-03',
//       totalPrice: 20000,
//       numberOfChildren: 1,
//       clientType: 'PRESENTIEL',
//       clientName: 'Test Client Acompte',
//       contactPhone: '+213555000008',
//       contactEmail: 'test.acompte@email.com',
//       specialRequests: 'Test avec acompte',
//       numberOfAdults: 2
//     };
//     const response = await api.post('/reservations', newReservation);
//     expect(response.status).toBe(201);
//     expect(response.data.data.reservation.depositAmount).toBe(5000);
//     expect(response.data.data.reservation.numberOfChildren).toBe(1);
//     expect(response.data.data.reservation.paymentMethod).toBe('CCP');
//     expect(response.data.data.reservation.paymentStatus).toBe('PENDING');
//     expect(response.data.data.reservation.clientType).toBe('PRESENTIEL');
//     expect(response.data.data.reservation.clientName).toBe('Test Client Acompte');
//     expect(response.data.data.reservation.contactPhone).toBe('+213555000008');
//     expect(response.data.data.reservation.contactEmail).toBe('test.acompte@email.com');
//     expect(response.data.data.reservation.specialRequests).toBe('Test avec acompte');
//     expect(response.data.data.reservation.numberOfAdults).toBe(2);
//     expect(response.data.data.reservation.totalPrice).toBe(20000);
//   });

//   test('Tentative de réservation avec nombre d\'adultes invalide', async () => {
//     const invalidReservation = {
//       roomId: createdRoomId,
//       clientName: 'Test Client',
//       clientType: 'PRESENTIEL',
//       checkInDate: '2025-09-01',
//       checkOutDate: '2025-09-03',
//       paymentMethod: 'CASH',
//       contactPhone: '+213555000005',
//       contactEmail: 'test@email.com',
//       numberOfAdults: 0,
//       numberOfChildren: 0,
//       specialRequests: 'Test',
//       totalPrice: 20000
//     };
//     try {
//       await api.post('/reservations', invalidReservation);
//     } catch (error) {
//       expect(error.response.status).toBe(400);
//       expect(error.response.data.message).toBe('Le nombre d\'adultes doit être supérieur à 0');
//     }
//   });

//   test('Tentative de réservation avec données manquantes', async () => {
//     const invalidReservation = testData.testCases.reservations.invalid[2].data;
//     try {
//       await api.post('/reservations', invalidReservation);
//     } catch (error) {
//       expect(error.response.status).toBe(400);
//       expect(error.response.data.message).toBe('Données de réservation incomplètes');
//     }
//   });

//   test('Tentative de réservation avec méthode de paiement invalide', async () => {
//     const invalidReservation = {
//       roomId: createdRoomId,
//       clientName: 'Test Client',
//       clientType: 'PRESENTIEL',
//       numberOfAdults: 2,
//       numberOfChildren: 1,
//       checkInDate: '2025-10-01',
//       checkOutDate: '2025-10-03',
//       contactPhone: '+213555000006',
//       contactEmail: 'test@email.com',
//       paymentMethod: 'INVALID',
//       specialRequests: 'Test',
//       totalPrice: 20000
//     };
//     try {
//       await api.post('/reservations', invalidReservation);
//     } catch (error) {
//       expect(error.response.status).toBe(400);
//       expect(error.response.data.message).toBe('Méthode de paiement invalide');
//     }
//   });

//   test('Upload de justificatif CCP', async () => {
//     const formData = new FormData();
//     formData.append('file', new Blob(['test'], { type: 'application/pdf' }), 'proof.pdf');
//     formData.append('reservationId', createdReservationId);
//     const response = await api.post('/reservations/upload-pdf', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data'
//       }
//     });
//     expect(response.status).toBe(200);
//     expect(response.data.data).toHaveProperty('fileName');
//   });
// });

// Tests supplémentaires des chambres
describe('Tests supplémentaires des chambres', () => {
  beforeAll(async () => {
    const response = await api.post('/auth/login', {
      username: testData.users[0].username,
      password: testData.users[0].password
    });
    authToken = response.data.data.token;
    setAuthToken(authToken);
  });

  test('Tentative de création de chambre avec prix négatif', async () => {
    const invalidRoom = {
      ...testData.testCases.rooms.invalid[0].data,
      description: 'Chambre test',
      capacity: 2
    };
    try {
      await api.post('/rooms', invalidRoom);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toBe('Le prix de base doit être positif');
    }
  });

  test('Tentative de création de chambre avec numéro dupliqué', async () => {
    const invalidRoom = {
      ...testData.testCases.rooms.invalid[1].data,
      description: 'Chambre test',
      capacity: 2
    };
    try {
      await api.post('/rooms', invalidRoom);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toBe('Ce numéro de chambre existe déjà');
    }
  });

  test('Tentative de création de chambre avec type invalide', async () => {
    const invalidRoom = {
      ...testData.testCases.rooms.invalid[2].data,
      description: 'Chambre test',
      capacity: 2
    };
    try {
      await api.post('/rooms', invalidRoom);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toBe('Type de chambre invalide');
    }
  });

  test('Tentative de création de chambre avec données manquantes', async () => {
    const invalidRoom = testData.testCases.rooms.invalid[3].data;
    try {
      await api.post('/rooms', invalidRoom);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toBe('Données de chambre incomplètes');
    }
  });

  test('Tentative de création de chambre avec prix par personne supplémentaire négatif', async () => {
    const invalidRoom = {
      ...testData.testCases.rooms.invalid[4].data,
      description: 'Chambre test',
      capacity: 2
    };
    try {
      await api.post('/rooms', invalidRoom);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toBe('Le prix par personne supplémentaire doit être positif');
    }
  });

  test('Transition d\'état de la chambre (LIBRE → RÉSERVÉE)', async () => {
    const updateData = testData.testCases.rooms.stateTransitions[0].data;
    const response = await api.patch(`/rooms/${createdRoomId}/status`, updateData);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('status', 'RÉSERVÉE');
  });

  test('Transition d\'état de la chambre (RÉSERVÉE → OCCUPÉE)', async () => {
    const updateData = testData.testCases.rooms.stateTransitions[1].data;
    const response = await api.patch(`/rooms/${createdRoomId}/status`, updateData);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('status', 'OCCUPÉE');
  });

  test('Transition d\'état de la chambre (OCCUPÉE → LIBRE)', async () => {
    const updateData = testData.testCases.rooms.stateTransitions[2].data;
    const response = await api.patch(`/rooms/${createdRoomId}/status`, updateData);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('status', 'LIBRE');
  });
});

// Tests des statistiques
describe('Tests des statistiques', () => {
  beforeAll(async () => {
    // Se connecter en tant que manager pour les statistiques
    const response = await api.post('/auth/login', {
      username: testData.users[0].username,
      password: testData.users[0].password
    });
    authToken = response.data.data.token;
    setAuthToken(authToken);
  });

  test('Récupération des statistiques de revenus', async () => {
    const response = await api.get('/statistics/revenue', {
      params: { period: '2025-06' }
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('totalRevenue');
    expect(response.data.data).toHaveProperty('revenueByRoomType');
  });

  test('Récupération des statistiques d\'occupation', async () => {
    const response = await api.get('/statistics/occupancy', {
      params: { period: '2025-06' }
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('occupancyRate');
    expect(response.data.data).toHaveProperty('totalRooms');
    expect(response.data.data).toHaveProperty('occupiedRooms');
  });

  test('Récupération des chambres populaires', async () => {
    const response = await api.get('/statistics/popular-rooms', {
      params: { period: '2025-06' }
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('byType');
  });

  test('Statistiques d\'occupation sans réservations', async () => {
    const response = await api.get('/statistics/occupation');
    expect(response.status).toBe(200);
    expect(response.data.data.occupiedRooms).toBe(0);
    expect(response.data.data.occupationRate).toBe(0);
  });
});

// Tests du suivi des employés
describe('Tests du suivi des employés', () => {
  beforeAll(async () => {
    // Se connecter en tant que manager pour le suivi des employés
    const response = await api.post('/auth/login', {
      username: testData.users[0].username,
      password: testData.users[0].password
    });
    authToken = response.data.data.token;
    setAuthToken(authToken);
  });

  test('Enregistrement d\'une action d\'employé', async () => {
    const action = testData.testCases.employeeTracking[0].data;
    const response = await api.post('/employee-tracking', action);
    expect(response.status).toBe(201);
  });
});

// Tests de maintenance
describe('Tests de maintenance', () => {
  beforeAll(async () => {
    // Se connecter en tant que manager pour la maintenance
    const response = await api.post('/auth/login', {
      username: testData.users[0].username,
      password: testData.users[0].password
    });
    authToken = response.data.data.token;
    setAuthToken(authToken);
  });

  test('Activation du mode maintenance', async () => {
    const maintenanceData = testData.testCases.maintenance[0].data;
    const response = await api.post('/maintenance', maintenanceData);
    expect(response.status).toBe(200);
  });

  test('Désactivation du mode maintenance', async () => {
    const maintenanceData = testData.testCases.maintenance[1].data;
    const response = await api.post('/maintenance', maintenanceData);
    expect(response.status).toBe(200);
  });
});

// Tests de gestion des comptes utilisateurs
describe('Tests de gestion des comptes utilisateurs', () => {
  let token;

  beforeAll(async () => {
    // Authentification en tant que manager
    const loginResponse = await api.post('/auth/login', {
      username: 'manager1',
      password: 'manager123'
    });
    token = loginResponse.data.data.token;
    setAuthToken(token);
  });

  test('Création d\'un nouveau réceptionniste', async () => {
    const newReceptionist = {
      username: 'receptionist2',
      password: 'reception123',
      role: 'RECEPTIONIST',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@hotel.com'
    };
    const response = await api.post('/users', newReceptionist);
    expect(response.status).toBe(201);
    expect(response.data.data).toHaveProperty('id');
    expect(response.data.data).toHaveProperty('username', newReceptionist.username);
    expect(response.data.data).toHaveProperty('role', newReceptionist.role);
    expect(response.data.data).toHaveProperty('firstName', newReceptionist.firstName);
    expect(response.data.data).toHaveProperty('lastName', newReceptionist.lastName);
    expect(response.data.data).toHaveProperty('email', newReceptionist.email);
  });

  test('Création d\'un nouveau manager', async () => {
    const newManager = {
      username: 'manager2',
      password: 'manager123',
      role: 'MANAGER',
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@hotel.com'
    };
    const response = await api.post('/users', newManager);
    expect(response.status).toBe(201);
    expect(response.data.data).toHaveProperty('id');
    expect(response.data.data).toHaveProperty('username', newManager.username);
    expect(response.data.data).toHaveProperty('role', newManager.role);
    expect(response.data.data).toHaveProperty('firstName', newManager.firstName);
    expect(response.data.data).toHaveProperty('lastName', newManager.lastName);
    expect(response.data.data).toHaveProperty('email', newManager.email);
  });

  test('Modification d\'un utilisateur existant', async () => {
    const userId = 2;
    const updateData = {
      firstName: 'Pierre',
      lastName: 'Durand',
      email: 'pierre.durand@hotel.com'
    };
    const response = await api.put(`/users/${userId}`, updateData);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('firstName', updateData.firstName);
    expect(response.data.data).toHaveProperty('lastName', updateData.lastName);
    expect(response.data.data).toHaveProperty('email', updateData.email);
  });

  test('Désactivation d\'un utilisateur', async () => {
    const userId = 2;
    const response = await api.patch(`/users/${userId}/status`, {
      isActive: false
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('isActive', false);
  });
});

// Test de tarification
describe('Test de tarification', () => {
  let token;
  let standardRoomId;
  let vipRoomId;
  let suiteRoomId;

  beforeAll(async () => {
    // Authentification
    const loginResponse = await api.post('/auth/login', {
      username: 'manager1',
      password: 'manager123'
    });
    token = loginResponse.data.data.token;
    setAuthToken(token);

    // Créer les chambres pour les tests
    const standardRoomResponse = await api.post('/rooms', {
      number: '401',
      type: 'STANDARD',
      basePrice: 10000,
      extraPersonPrice: 2000,
      capacity: 2,
      description: 'Chambre standard pour tests'
    });
    standardRoomId = standardRoomResponse.data.data.id;

    const vipRoomResponse = await api.post('/rooms', {
      number: '501',
      type: 'VIP',
      basePrice: 20000,
      extraPersonPrice: 3000,
      capacity: 4,
      description: 'Chambre VIP pour tests'
    });
    vipRoomId = vipRoomResponse.data.data.id;

    const suiteRoomResponse = await api.post('/rooms', {
      number: '601',
      type: 'SUITE',
      basePrice: 30000,
      extraPersonPrice: 4000,
      capacity: 6,
      description: 'Suite pour tests'
    });
    suiteRoomId = suiteRoomResponse.data.data.id;
  });

  test('Calcul du prix pour chambre standard, 2 adultes, 2 nuits', async () => {
    const response = await api.post('/reservations/calculate-price', {
      roomId: standardRoomId,
      numberOfAdults: 2,
      numberOfChildren: 0,
      checkInDate: '2025-07-01',
      checkOutDate: '2025-07-03'
    });
    expect(response.status).toBe(200);
    expect(response.data.data.totalPrice).toBe(20000);
    expect(response.data.data.priceDetails).toEqual({
      basePrice: 10000,
      extraPersonPrice: 2000,
      nights: 2,
      capacity: 2,
      extraAdults: 0,
      basePrice: 20000,
      extraPrice: 0
    });
  });

  test('Calcul du prix pour chambre standard, 3 adultes, 2 nuits', async () => {
    const response = await api.post('/reservations/calculate-price', {
      roomId: standardRoomId,
      numberOfAdults: 3,
      numberOfChildren: 0,
      checkInDate: '2025-07-01',
      checkOutDate: '2025-07-03'
    });
    expect(response.status).toBe(200);
    expect(response.data.data.totalPrice).toBe(24000);
    expect(response.data.data.priceDetails).toEqual({
      basePrice: 10000,
      extraPersonPrice: 2000,
      nights: 2,
      capacity: 2,
      extraAdults: 1,
      basePrice: 20000,
      extraPrice: 4000
    });
  });

  test('Calcul du prix pour chambre VIP, 4 adultes, 4 nuits', async () => {
    const response = await api.post('/reservations/calculate-price', {
      roomId: vipRoomId,
      numberOfAdults: 4,
      numberOfChildren: 0,
      checkInDate: '2025-07-01',
      checkOutDate: '2025-07-05'
    });
    expect(response.status).toBe(200);
    expect(response.data.data.totalPrice).toBe(80000);
    expect(response.data.data.priceDetails).toEqual({
      basePrice: 20000,
      extraPersonPrice: 3000,
      nights: 4,
      capacity: 4,
      extraAdults: 0,
      basePrice: 80000,
      extraPrice: 0
    });
  });

  test('Calcul du prix pour chambre VIP, 6 adultes, 4 nuits', async () => {
    const response = await api.post('/reservations/calculate-price', {
      roomId: vipRoomId,
      numberOfAdults: 6,
      numberOfChildren: 0,
      checkInDate: '2025-07-01',
      checkOutDate: '2025-07-05'
    });
    expect(response.status).toBe(200);
    expect(response.data.data.totalPrice).toBe(104000);
    expect(response.data.data.priceDetails).toEqual({
      basePrice: 20000,
      extraPersonPrice: 3000,
      nights: 4,
      capacity: 4,
      extraAdults: 2,
      basePrice: 80000,
      extraPrice: 24000
    });
  });

  test('Calcul du prix pour suite, 6 adultes, 3 nuits', async () => {
    const response = await api.post('/reservations/calculate-price', {
      roomId: suiteRoomId,
      numberOfAdults: 6,
      numberOfChildren: 0,
      checkInDate: '2025-07-01',
      checkOutDate: '2025-07-04'
    });
    expect(response.status).toBe(200);
    expect(response.data.data.totalPrice).toBe(90000);
    expect(response.data.data.priceDetails).toEqual({
      basePrice: 30000,
      extraPersonPrice: 4000,
      nights: 3,
      capacity: 6,
      extraAdults: 0,
      basePrice: 90000,
      extraPrice: 0
    });
  });

  test('Calcul du prix pour suite, 8 adultes, 3 nuits', async () => {
    const response = await api.post('/reservations/calculate-price', {
      roomId: suiteRoomId,
      numberOfAdults: 8,
      numberOfChildren: 0,
      checkInDate: '2025-07-01',
      checkOutDate: '2025-07-04'
    });
    expect(response.status).toBe(200);
    expect(response.data.data.totalPrice).toBe(114000);
    expect(response.data.data.priceDetails).toEqual({
      basePrice: 30000,
      extraPersonPrice: 4000,
      nights: 3,
      capacity: 6,
      extraAdults: 2,
      basePrice: 90000,
      extraPrice: 24000
    });
  });
});

// Tests d'acompte
describe('Tests d\'acompte', () => {
  let token;
  let createdRoomId;
  let vipRoomId;

  beforeAll(async () => {
    // Authentification en tant que manager pour créer les chambres
    const loginResponse = await api.post('/auth/login', {
      username: 'manager1',
      password: 'manager123'
    });
    token = loginResponse.data.data.token;
    setAuthToken(token);

    // Créer une chambre standard pour les tests
    const roomResponse = await api.post('/rooms', {
      number: '701',
      type: 'STANDARD',
      basePrice: 1000,
      extraPersonPrice: 200,
      capacity: 2,
      description: 'Chambre standard pour tests d\'acompte'
    });
    createdRoomId = roomResponse.data.data.id;

    // Créer une chambre VIP pour les tests
    const vipRoomResponse = await api.post('/rooms', {
      number: '702',
      type: 'VIP',
      basePrice: 2000,
      extraPersonPrice: 400,
      capacity: 4,
      description: 'Chambre VIP pour tests d\'acompte'
    });
    vipRoomId = vipRoomResponse.data.data.id;
  });

  test('Calculer l\'acompte pour une chambre standard', async () => {
    // Se connecter en tant que réceptionniste
    const loginResponse = await api.post('/auth/login', {
      username: 'receptionist1',
      password: 'reception123'
    });
    setAuthToken(loginResponse.data.data.token);

    const response = await api.post('/reservations/calculate-deposit', {
      roomId: createdRoomId,
      totalPrice: 2000,
      checkInDate: '2025-07-01',
      checkOutDate: '2025-07-03',
      numberOfAdults: 2,
      numberOfChildren: 0
    });
    expect(response.status).toBe(200);
    expect(response.data.data.depositAmount).toBe(1000);
    expect(response.data.data.depositPercentage).toBe(50);
    expect(response.data.data.remainingAmount).toBe(1000);
  });

  test('Calculer l\'acompte pour une chambre VIP', async () => {
    // Se connecter en tant que réceptionniste
    const loginResponse = await api.post('/auth/login', {
      username: 'receptionist1',
      password: 'reception123'
    });
    setAuthToken(loginResponse.data.data.token);

    const response = await api.post('/reservations/calculate-deposit', {
      roomId: vipRoomId,
      totalPrice: 4000,
      checkInDate: '2025-07-01',
      checkOutDate: '2025-07-03',
      numberOfAdults: 4,
      numberOfChildren: 0
    });
    expect(response.status).toBe(200);
    expect(response.data.data.depositAmount).toBe(1200);
    expect(response.data.data.depositPercentage).toBe(30);
    expect(response.data.data.remainingAmount).toBe(2800);
  });
});

// Tests de validation des dates
describe('Tests de validation des dates', () => {
  beforeAll(async () => {
    const response = await api.post('/auth/login', {
      username: testData.users[1].username,
      password: testData.users[1].password
    });
    authToken = response.data.data.token;
    setAuthToken(authToken);
  });

  test('Tentative de réservation avec dates invalides', async () => {
    const invalidReservation = {
      ...testData.testCases.reservations.invalid[0].data,
      roomId: createdRoomId,
      checkInDate: '2025-07-03',
      checkOutDate: '2025-07-01',
      clientName: 'Test Client',
      clientType: 'PRESENTIEL',
      numberOfAdults: 2,
      numberOfChildren: 0,
      paymentMethod: 'CASH',
      contactPhone: '+213555000004',
      contactEmail: 'test@email.com',
      specialRequests: 'Test',
      totalPrice: 20000
    };
    try {
      await api.post('/reservations', invalidReservation);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toBe('La date de départ doit être postérieure à la date d\'arrivée');
    }
  });
});

// Gestion des erreurs
describe('Tests de gestion des erreurs', () => {
  test('Tentative de création de réservation invalide', async () => {
    const invalidReservation = {
      roomId: createdRoomId,
      checkInDate: '2025-11-01',
      checkOutDate: '2025-11-03',
      clientName: 'Test Client',
      clientType: 'PRESENTIEL',
      numberOfAdults: 2,
      numberOfChildren: 0,
      paymentMethod: 'CASH',
      contactPhone: '+213555000007',
      contactEmail: 'test@email.com',
      specialRequests: 'Test',
      totalPrice: 20000
    };
    try {
      await api.post('/reservations', invalidReservation);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty('message');
      expect(error.response.data.message).toMatch(/^(Données de réservation incomplètes|Chambre non disponible pour les dates spécifiées|Nombre d'adultes invalide|Méthode de paiement invalide)$/);
    }
  });

  test('Tentative d\'accès non autorisé', async () => {
    setAuthToken(null);
    try {
      await api.get('/rooms');
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  test('Tentative d\'accès à une ressource inexistante', async () => {
    setAuthToken(authToken);
    try {
      await api.get('/rooms/999999');
    } catch (error) {
      expect(error.response.status).toBe(404);
    }
  });
});

// Tests des activités
describe('Tests des activités', () => {
  let token;

  beforeAll(async () => {
    // Authentification en tant que manager
    const loginResponse = await api.post('/auth/login', {
      username: 'manager1',
      password: 'manager123'
    });
    token = loginResponse.data.data.token;
    setAuthToken(token);
  });

  test('Génération de fiche PDF pour le restaurant', async () => {
    const response = await api.post('/activities/generate-pdf', {
      type: 'restaurant',
      date: '2025-06-10',
      period: '2025-06',
      reservations: [],
      totalGuests: 0
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('pdfUrl');
    expect(response.data.data.pdfUrl).toContain('restaurant_2025-06-10.pdf');
  });

  test('Génération de fiche PDF pour le restaurant avec réservations', async () => {
    const response = await api.post('/activities/generate-pdf', {
      type: 'restaurant',
      date: '2025-06-10',
      period: '2025-06',
      reservations: [{ id: createdReservationId, clientName: 'Test Client', numberOfAdults: 2, numberOfChildren: 1 }],
      totalGuests: 3
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('pdfUrl');
    expect(response.data.data.pdfUrl).toContain('restaurant_2025-06-10.pdf');
    expect(response.data.data).toHaveProperty('totalGuests', 3);
  });

  test('Génération de fiche PDF pour la piscine', async () => {
    const response = await api.post('/activities/generate-pdf', {
      type: 'pool',
      date: '2025-06-10',
      period: '2025-06',
      reservations: [],
      totalGuests: 0
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('pdfUrl');
    expect(response.data.data.pdfUrl).toContain('pool_2025-06-10.pdf');
  });

  test('Génération de fiche PDF pour la piscine avec réservations', async () => {
    const response = await api.post('/activities/generate-pdf', {
      type: 'pool',
      date: '2025-06-10',
      period: '2025-06',
      reservations: [{ id: createdReservationId, clientName: 'Test Client', numberOfAdults: 2, numberOfChildren: 1 }],
      totalGuests: 3
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('pdfUrl');
    expect(response.data.data.pdfUrl).toContain('pool_2025-06-10.pdf');
    expect(response.data.data).toHaveProperty('totalGuests', 3);
  });

  test('Génération de fiche PDF pour la salle de sport', async () => {
    const response = await api.post('/activities/generate-pdf', {
      type: 'gym',
      date: '2025-06-10',
      period: '2025-06',
      reservations: [],
      totalGuests: 0
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('pdfUrl');
    expect(response.data.data.pdfUrl).toContain('gym_2025-06-10.pdf');
  });

  test('Génération de fiche PDF pour la salle de sport avec réservations', async () => {
    const response = await api.post('/activities/generate-pdf', {
      type: 'gym',
      date: '2025-06-10',
      period: '2025-06',
      reservations: [{ id: createdReservationId, clientName: 'Test Client', numberOfAdults: 2, numberOfChildren: 1 }],
      totalGuests: 3
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('pdfUrl');
    expect(response.data.data.pdfUrl).toContain('gym_2025-06-10.pdf');
    expect(response.data.data).toHaveProperty('totalGuests', 3);
  });
});

// Tests du suivi budgétaire
describe('Tests du suivi budgétaire', () => {
  let token;

  beforeAll(async () => {
    // Authentification en tant que manager
    const loginResponse = await api.post('/auth/login', {
      username: 'manager1',
      password: 'manager123'
    });
    token = loginResponse.data.data.token;
    setAuthToken(token);
  });

  test('Suivi des revenus journaliers', async () => {
    const response = await api.get('/finance/daily', {
      params: { date: '2025-06-10' }
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('cashTotal');
    expect(response.data.data).toHaveProperty('ccpTotal');
    expect(response.data.data).toHaveProperty('total');
  });

  test('Validation des revenus journaliers', async () => {
    await api.post('/reservations', {
      ...testData.reservations[0],
      roomId: createdRoomId,
      depositAmount: 5000,
      paymentMethod: 'CASH',
      checkInDate: '2025-06-10',
      checkOutDate: '2025-06-12'
    });
    const response = await api.get('/finance/daily', {
      params: { date: '2025-06-10' }
    });
    expect(response.status).toBe(200);
    expect(response.data.data.cashTotal).toBeGreaterThanOrEqual(5000);
  });

  test('Suivi des revenus par réceptionniste', async () => {
    const response = await api.get('/finance/by-receptionist', {
      params: {
        startDate: '2025-06-01',
        endDate: '2025-06-30'
      }
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toBeInstanceOf(Object);
    Object.values(response.data.data).forEach(stats => {
      expect(stats).toHaveProperty('cash');
      expect(stats).toHaveProperty('ccp');
      expect(stats).toHaveProperty('total');
    });
  });

  test('Suivi des revenus par période', async () => {
    const response = await api.get('/finance/by-period', {
      params: {
        startDate: '2025-06-01',
        endDate: '2025-06-30'
      }
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('daily');
    expect(response.data.data).toHaveProperty('weekly');
    expect(response.data.data).toHaveProperty('monthly');
  });
});

// Tests des statistiques d'occupation
describe('Tests des statistiques d\'occupation', () => {
  let token;

  beforeAll(async () => {
    // Authentification en tant que manager
    const loginResponse = await api.post('/auth/login', {
      username: 'manager1',
      password: 'manager123'
    });
    token = loginResponse.data.data.token;
    setAuthToken(token);
  });

  test('Récupération des statistiques d\'occupation', async () => {
    const response = await api.get('/statistics/occupation');
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('totalRooms');
    expect(response.data.data).toHaveProperty('availableRooms');
    expect(response.data.data).toHaveProperty('reservedRooms');
    expect(response.data.data).toHaveProperty('occupiedRooms');
    expect(response.data.data).toHaveProperty('occupationRate');
  });

  test('Récupération des statistiques par type de chambre', async () => {
    const response = await api.get('/statistics/by-room-type');
    expect(response.status).toBe(200);
    expect(response.data.data).toBeInstanceOf(Object);
    Object.values(response.data.data).forEach(stats => {
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('available');
      expect(stats).toHaveProperty('reserved');
      expect(stats).toHaveProperty('occupied');
    });
  });

  test('Récupération des statistiques de clients', async () => {
    const response = await api.get('/statistics/clients');
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('totalClients');
    expect(response.data.data).toHaveProperty('clientsByType');
    expect(response.data.data).toHaveProperty('averageStayDuration');
  });
});

// Tests financiers détaillés
describe('Tests financiers détaillés', () => {
  beforeAll(async () => {
    const response = await api.post('/auth/login', {
      username: testData.users[0].username,
      password: testData.users[0].password
    });
    authToken = response.data.data.token;
    setAuthToken(authToken);
  });

  test('Suivi quotidien des paiements en espèces', async () => {
    const data = testData.testCases.finance.daily[0].data;
    const response = await api.get('/finance/daily', { params: data });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('total');
    expect(response.data.data).toHaveProperty('byReservation');
    expect(response.data.data.total).toBeGreaterThanOrEqual(0);
  });

  test('Suivi quotidien des paiements CCP', async () => {
    const data = testData.testCases.finance.daily[1].data;
    const response = await api.get('/finance/daily', { params: data });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('total');
    expect(response.data.data).toHaveProperty('byReservation');
    expect(response.data.data.total).toBeGreaterThanOrEqual(0);
  });

  test('Suivi financier par employé', async () => {
    const data = testData.testCases.finance.tracking[0].data;
    const response = await api.get('/finance/employee', { params: data });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('cash');
    expect(response.data.data).toHaveProperty('ccp');
    expect(response.data.data).toHaveProperty('total');
    expect(response.data.data.total).toBeGreaterThanOrEqual(0);
  });

  test('Tentative de suivi financier pour un employé invalide', async () => {
    const data = testData.testCases.finance.tracking[1].data;
    try {
      await api.get('/finance/employee', { params: data });
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data.message).toBe(testData.testCases.finance.tracking[1].expectedError);
    }
  });
});

// Tests de facturation et historique des paiements
describe('Tests de facturation et historique des paiements', () => {
  beforeAll(async () => {
    // Se connecter en tant que réceptionniste
    const response = await api.post('/auth/login', {
      username: 'receptionist1',
      password: 'reception123'
    });
    authToken = response.data.data.token;
    setAuthToken(authToken);
  });

  test('Génération de facture pour une réservation', async () => {
    const response = await api.post(`/reservations/${createdReservationId}/invoice`);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('invoiceUrl');
    expect(response.data.data.invoiceUrl).toContain(`/invoices/reservation_${createdReservationId}.pdf`);
  });

  test('Récupération de l\'historique des paiements', async () => {
    const response = await api.get(`/reservations/${createdReservationId}/payments`);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('payments');
    expect(Array.isArray(response.data.data.payments)).toBe(true);
    if (response.data.data.payments.length > 0) {
      const payment = response.data.data.payments[0];
      expect(payment).toHaveProperty('amount');
      expect(payment).toHaveProperty('method');
      expect(payment).toHaveProperty('date');
    }
  });

  test('Tentative de génération de facture pour une réservation inexistante', async () => {
    try {
      await api.post('/reservations/999999/invoice');
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data.message).toBe('Réservation non trouvée');
    }
  });

  test('Tentative de récupération de l\'historique des paiements pour une réservation inexistante', async () => {
    try {
      await api.get('/reservations/999999/payments');
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data.message).toBe('Réservation non trouvée');
    }
  });
});