const axios = require('axios');
const testData = require('./test.json');
const request = require('supertest');
const app = require('./src/index'); // Correction du chemin d'importation

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

// Tests des chambres
describe('Tests de gestion des chambres', () => {
  beforeAll(async () => {
    // Se connecter en tant que manager pour les opérations sur les chambres
    const response = await api.post('/auth/login', {
      username: testData.users[0].username,
      password: testData.users[0].password
    });
    authToken = response.data.data.token;
    setAuthToken(authToken);
  });

  test('Création d\'une nouvelle chambre', async () => {
    const newRoom = testData.rooms[0];
    const response = await api.post('/rooms', newRoom);
    expect(response.status).toBe(201);
    expect(response.data.data).toHaveProperty('number', newRoom.number);
    createdRoomId = response.data.data.id;
  });

  test('Récupération de toutes les chambres', async () => {
    const response = await api.get('/rooms');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(response.data.data.length).toBeGreaterThan(0);
  });

  test('Récupération d\'une chambre spécifique', async () => {
    const response = await api.get(`/rooms/${testData.rooms[0].number}`);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('number', testData.rooms[0].number);
  });

  test('Mise à jour du statut d\'une chambre', async () => {
    const updateData = {
      status: 'OCCUPÉE'
    };
    const response = await api.patch(`/rooms/${createdRoomId}/status`, updateData);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('status', 'OCCUPÉE');
  });
});

// Tests des réservations
describe('Tests de gestion des réservations', () => {
  beforeAll(async () => {
    // Se connecter en tant que réceptionniste pour les opérations sur les réservations
    const response = await api.post('/auth/login', {
      username: testData.users[1].username,
      password: testData.users[1].password
    });
    authToken = response.data.data.token;
    setAuthToken(authToken);
  });

  test('Création d\'une nouvelle réservation', async () => {
    const newReservation = {
      ...testData.reservations[0],
      roomId: createdRoomId
    };
    const response = await api.post('/reservations', newReservation);
    expect(response.status).toBe(201);
    expect(response.data.data.reservation).toHaveProperty('clientName', newReservation.clientName);
    createdReservationId = response.data.data.reservation.id;
  });

  test('Récupération de toutes les réservations', async () => {
    const response = await api.get('/reservations');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  test('Récupération d\'une réservation spécifique', async () => {
    const response = await api.get(`/reservations/${createdReservationId}`);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('id', createdReservationId);
  });

  test('Mise à jour du statut de paiement', async () => {
    const updateData = {
      paymentStatus: 'COMPLETED'
    };
    const response = await api.patch(`/reservations/${createdReservationId}/payment`, updateData);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('paymentStatus', 'COMPLETED');
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

// Tests supplémentaires des réservations
describe('Tests supplémentaires des réservations', () => {
  beforeAll(async () => {
    const response = await api.post('/auth/login', {
      username: testData.users[1].username,
      password: testData.users[1].password
    });
    authToken = response.data.data.token;
    setAuthToken(authToken);
  });

  test('Création d\'une réservation garantie par manager', async () => {
    const newReservation = {
      ...testData.testCases.reservations.valid[1].data,
      roomId: createdRoomId
    };
    const response = await api.post('/reservations', newReservation);
    expect(response.status).toBe(201);
    expect(response.data.data.reservation).toHaveProperty('guaranteedBy', 'manager1');
  });

  test('Création d\'une réservation avec acompte', async () => {
    const newReservation = {
      ...testData.testCases.reservations.valid[2].data,
      roomId: createdRoomId,
      depositAmount: 5000,
      paymentMethod: 'CCP',
      paymentStatus: 'PENDING',
      checkInDate: '2025-08-01',
      checkOutDate: '2025-08-03',
      totalPrice: 20000
    };
    const response = await api.post('/reservations', newReservation);
    expect(response.status).toBe(201);
    expect(response.data.data.reservation.depositAmount).toBe(5000);
  });

  test('Tentative de réservation avec nombre d\'adultes invalide', async () => {
    const invalidReservation = {
      roomId: createdRoomId,
      clientName: 'Test Client',
      clientType: 'PRESENTIEL',
      checkInDate: '2025-09-01',
      checkOutDate: '2025-09-03',
      paymentMethod: 'CASH',
      contactPhone: '+213555000005',
      contactEmail: 'test@email.com',
      numberOfAdults: 0,
      specialRequests: 'Test',
      totalPrice: 20000
    };
    try {
      await api.post('/reservations', invalidReservation);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toBe('Le nombre d\'adultes doit être supérieur à 0');
    }
  });

  test('Tentative de réservation avec données manquantes', async () => {
    const invalidReservation = testData.testCases.reservations.invalid[2].data;
    try {
      await api.post('/reservations', invalidReservation);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toBe('Données de réservation incomplètes');
    }
  });

  test('Tentative de réservation avec méthode de paiement invalide', async () => {
    const invalidReservation = {
      roomId: createdRoomId,
      clientName: 'Test Client',
      clientType: 'PRESENTIEL',
      numberOfAdults: 2,
      checkInDate: '2025-10-01',
      checkOutDate: '2025-10-03',
      contactPhone: '+213555000006',
      contactEmail: 'test@email.com',
      paymentMethod: 'INVALID',
      specialRequests: 'Test',
      totalPrice: 20000
    };
    try {
      await api.post('/reservations', invalidReservation);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toBe('Méthode de paiement invalide');
    }
  });

  test('Upload de justificatif CCP', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'application/pdf' }), 'proof.pdf');
    formData.append('reservationId', createdReservationId);

    const response = await api.post('/reservations/upload-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('fileName');
  });
});

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

// Tests des utilisateurs
describe('Tests des utilisateurs', () => {
  beforeAll(async () => {
    const response = await api.post('/auth/login', {
      username: testData.users[0].username,
      password: testData.users[0].password
    });
    authToken = response.data.data.token;
    setAuthToken(authToken);
  });

  test('Création d\'un nouveau manager', async () => {
    const newManager = testData.testCases.users.valid[0].data;
    const response = await api.post('/users', newManager);
    expect(response.status).toBe(201);
    expect(response.data.data).toHaveProperty('username', newManager.username);
    expect(response.data.data).toHaveProperty('role', 'MANAGER');
  });

  test('Création d\'un nouveau réceptionniste', async () => {
    const newReceptionist = testData.testCases.users.valid[1].data;
    const response = await api.post('/users', newReceptionist);
    expect(response.status).toBe(201);
    expect(response.data.data).toHaveProperty('username', newReceptionist.username);
    expect(response.data.data).toHaveProperty('role', 'RECEPTIONIST');
  });

  test('Tentative de création d\'utilisateur avec nom d\'utilisateur dupliqué', async () => {
    const invalidUser = testData.testCases.users.invalid[0].data;
    try {
      await api.post('/users', invalidUser);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toBe('Ce nom d\'utilisateur existe déjà');
    }
  });

  test('Tentative de création d\'utilisateur avec rôle invalide', async () => {
    const invalidUser = testData.testCases.users.invalid[1].data;
    try {
      await api.post('/users', invalidUser);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toBe('Rôle utilisateur invalide');
    }
  });

  test('Tentative de création d\'utilisateur avec données manquantes', async () => {
    const invalidUser = testData.testCases.users.invalid[2].data;
    try {
      await api.post('/users', invalidUser);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toBe('Données utilisateur incomplètes');
    }
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

  beforeAll(async () => {
    // Authentification
    const loginResponse = await api.post('/auth/login', {
      username: 'manager1',
      password: 'manager123'
    });
    token = loginResponse.data.data.token;
    setAuthToken(token);

    // Créer une chambre pour les tests
    const roomResponse = await api.post('/rooms', {
      number: '701',
      type: 'STANDARD',
      basePrice: 1000,
      extraPersonPrice: 200,
      capacity: 2,
      description: 'Chambre standard pour tests d\'acompte'
    });
    createdRoomId = roomResponse.data.data.id;
  });

  test('Calculer l\'acompte pour une chambre standard', async () => {
    const response = await api.post('/reservations/deposit/calculate', {
      roomId: createdRoomId,
      totalPrice: 2000,
      roomType: 'STANDARD'
    });

    expect(response.status).toBe(200);
    expect(response.data.data.depositAmount).toBe(1000); // 50% de 2000
  });

  test('Créer une réservation avec acompte', async () => {
    // Se connecter en tant que réceptionniste
    const loginResponse = await api.post('/auth/login', {
      username: 'receptionist1',
      password: 'reception123'
    });
    setAuthToken(loginResponse.data.data.token);

    const response = await api.post('/reservations', {
      clientName: 'Test Client',
      clientType: 'PRESENTIEL',
      numberOfAdults: 2,
      checkInDate: '2025-07-01',
      checkOutDate: '2025-07-03',
      paymentMethod: 'CCP',
      roomId: createdRoomId,
      contactPhone: '+213555000001',
      contactEmail: 'test.client@email.com',
      depositAmount: 1000,
      totalPrice: 2000
    });

    expect(response.status).toBe(201);
    expect(response.data.data.reservation.depositAmount).toBe(1000);
    expect(response.data.data.reservation.paymentStatus).toBe('PENDING');
  });

  test('Calculer l\'acompte pour une chambre VIP', async () => {
    const response = await api.post('/reservations/deposit/calculate', {
      roomId: createdRoomId,
      totalPrice: 4000,
      roomType: 'VIP'
    });

    expect(response.status).toBe(200);
    expect(response.data.data.depositAmount).toBe(1200); // 30% de 4000
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
    // Authentification
    const loginResponse = await api.post('/auth/login', {
      username: 'manager1',
      password: 'manager123'
    });
    token = loginResponse.data.data.token;
    setAuthToken(token);
  });

  test('Génération du PDF pour le restaurant', async () => {
    const response = await api.post('/activities/pdf', {
      type: 'restaurant',
      date: '2025-06-10',
      data: {
        reservations: [],
        totalGuests: 0,
        period: '2025-06'
      }
    });

    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('pdfUrl');
    expect(response.data.data.pdfUrl).toContain('restaurant_2025-06-10.pdf');
  });

  test('Génération du PDF pour la piscine', async () => {
    const response = await api.post('/activities/pdf', {
      type: 'pool',
      date: '2025-06-10',
      data: {
        reservations: [],
        totalGuests: 0,
        period: '2025-06'
      }
    });

    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('pdfUrl');
    expect(response.data.data.pdfUrl).toContain('pool_2025-06-10.pdf');
  });

  test('Génération du PDF pour la salle de sport', async () => {
    const response = await api.post('/activities/pdf', {
      type: 'gym',
      date: '2025-06-10',
      data: {
        reservations: [],
        totalGuests: 0,
        period: '2025-06'
      }
    });

    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('pdfUrl');
    expect(response.data.data.pdfUrl).toContain('gym_2025-06-10.pdf');
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
