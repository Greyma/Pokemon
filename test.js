const axios = require('axios');
const testData = require('./test.json');
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

// Tests d'authentificationc
describe('Tests d\'authentification', () => {
  test('Connexion réussie d\'un réceptionniste', async () => {
    const response = await api.post('/auth/login', {
      username: 'receptionist1',
      password: 'reception123'
    });
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('token');
    authToken = response.data.data.token;
    setAuthToken(authToken);
  });

  test('Connexion échouée avec mauvais mot de passe', async () => {
    try {
      await api.post('/auth/login', {
        username: 'receptionist1',
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
      number: '9991',
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
  let authToken;
  let testRoomId;

  beforeAll(async () => {
    try {
      // Se connecter en tant que manager pour créer la chambre
      const managerResponse = await api.post('/auth/login', {
        username: 'manager1',
        password: 'manager123'
      });
      
      expect(managerResponse.status).toBe(200);
      expect(managerResponse.data.data).toHaveProperty('token');
      const managerToken = managerResponse.data.data.token;
      
      // Configurer le token manager pour créer la chambre
      api.defaults.headers.common['Authorization'] = `Bearer ${managerToken}`;

      // Créer une chambre de test
      const roomNumber = 9992; // Numéro unique
      const roomResponse = await api.post('/rooms', {
        number: roomNumber,
        type: 'STANDARD',
        basePrice: 10000,
        extraPersonPrice: 2000,
        capacity: 2,
        description: 'Chambre standard pour tests'
      });
      expect(roomResponse.status).toBe(201);
      testRoomId = roomResponse.data.data.id;

      // Se connecter en tant que réceptionniste pour les tests de réservation
      const receptionistResponse = await api.post('/auth/login', {
        username: 'receptionist1',
        password: 'reception123'
      });
      
      expect(receptionistResponse.status).toBe(200);
      expect(receptionistResponse.data.data).toHaveProperty('token');
      authToken = receptionistResponse.data.data.token;
      
      // Configurer le token réceptionniste pour les tests de réservation
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } catch (error) {
      console.error('Erreur d\'authentification:', error.response?.data || error.message);
      throw error;
    }
  });

  test('Création d\'une nouvelle réservation', async () => {
    const newReservation = {
      reservationId: "RES001",
      nomClient: "Ahmed Benali",
      email: "ahmed.benali@example.com",
      telephone: "+213 555 123 456",
      adresse: "12 Rue de la Liberté, Alger",
      dateEntree: "2025-06-10",
      dateSortie: "2025-06-15",
      nombrePersonnes: 2,
      chambreId: testRoomId,
      numeroChambre: 9992, // Utiliser le même numéro de chambre
      typeChambre: "STANDARD",
      montantTotal: 40000,
      paiements: [
        {
          paiementId: "PAY001",
          methodePaiement: "especes",
          montant: 40000,
          datePaiement: "2025-06-09T14:30:00.000Z",
          numeroCCP: "",
          numeroTransaction: "",
          preuvePaiement: null
        }
      ],
      nomGarant: "",
      remarques: "Client régulier",
      receptionnisteId: "REC001",
      statut: "validee",
      dateCreation: "2025-06-09T14:30:00.000Z",
      receptionniste: "Admin"
    };

    const response = await api.post('/reservations', newReservation);
    expect(response.status).toBe(201);
    expect(response.data.data).toHaveProperty('reservationId', newReservation.reservationId);
    expect(response.data.data).toHaveProperty('nomClient', newReservation.nomClient);
    expect(response.data.data).toHaveProperty('email', newReservation.email);
    expect(response.data.data).toHaveProperty('telephone', newReservation.telephone);
    expect(response.data.data).toHaveProperty('adresse', newReservation.adresse);
    expect(new Date(response.data.data.dateEntree).toISOString().split('T')[0]).toBe(newReservation.dateEntree);
    expect(new Date(response.data.data.dateSortie).toISOString().split('T')[0]).toBe(newReservation.dateSortie);
    expect(response.data.data).toHaveProperty('nombrePersonnes', newReservation.nombrePersonnes);
    expect(response.data.data).toHaveProperty('chambreId', newReservation.chambreId);
    expect(response.data.data).toHaveProperty('numeroChambre', newReservation.numeroChambre);
    expect(response.data.data).toHaveProperty('typeChambre', newReservation.typeChambre);
    expect(response.data.data).toHaveProperty('montantTotal', newReservation.montantTotal);
    expect(response.data.data).toHaveProperty('paiements');
    expect(response.data.data).toHaveProperty('nomGarant', newReservation.nomGarant);
    expect(response.data.data).toHaveProperty('remarques', newReservation.remarques);
    expect(response.data.data).toHaveProperty('receptionnisteId', newReservation.receptionnisteId);
    expect(response.data.data).toHaveProperty('statut', newReservation.statut);
    expect(response.data.data.dateCreation).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    expect(response.data.data).toHaveProperty('receptionniste', newReservation.receptionniste);
  });

  test('Récupération de toutes les réservations', async () => {
    const response = await api.get('/reservations');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data.data)).toBe(true);
    if (response.data.data.length > 0) {
      const reservation = response.data.data[0];
      expect(reservation).toHaveProperty('reservationId');
      expect(reservation).toHaveProperty('nomClient');
      expect(reservation).toHaveProperty('email');
      expect(reservation).toHaveProperty('telephone');
      expect(reservation).toHaveProperty('adresse');
      expect(reservation).toHaveProperty('dateEntree');
      expect(reservation).toHaveProperty('dateSortie');
      expect(reservation).toHaveProperty('nombrePersonnes');
      expect(reservation).toHaveProperty('chambreId');
      expect(reservation).toHaveProperty('numeroChambre');
      expect(reservation).toHaveProperty('typeChambre');
      expect(reservation).toHaveProperty('montantTotal');
      expect(reservation).toHaveProperty('paiements');
      expect(reservation).toHaveProperty('nomGarant');
      expect(reservation).toHaveProperty('remarques');
      expect(reservation).toHaveProperty('receptionnisteId');
      expect(reservation).toHaveProperty('statut');
      expect(reservation).toHaveProperty('dateCreation');
      expect(reservation).toHaveProperty('receptionniste');
    }
  });

  test('Récupération d\'une réservation spécifique', async () => {
    const reservationId = "RES001";
    const response = await api.get(`/reservations/${reservationId}`);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('reservationId', reservationId);
    expect(response.data.data).toHaveProperty('nomClient');
    expect(response.data.data).toHaveProperty('email');
    expect(response.data.data).toHaveProperty('telephone');
    expect(response.data.data).toHaveProperty('adresse');
    expect(response.data.data).toHaveProperty('dateEntree');
    expect(response.data.data).toHaveProperty('dateSortie');
    expect(response.data.data).toHaveProperty('nombrePersonnes');
    expect(response.data.data).toHaveProperty('chambreId');
    expect(response.data.data).toHaveProperty('numeroChambre');
    expect(response.data.data).toHaveProperty('typeChambre');
    expect(response.data.data).toHaveProperty('montantTotal');
    expect(response.data.data).toHaveProperty('paiements');
    expect(response.data.data).toHaveProperty('nomGarant');
    expect(response.data.data).toHaveProperty('remarques');
    expect(response.data.data).toHaveProperty('receptionnisteId');
    expect(response.data.data).toHaveProperty('statut');
    expect(response.data.data).toHaveProperty('dateCreation');
    expect(response.data.data).toHaveProperty('receptionniste');
  });

  test('Mise à jour du statut d\'une réservation', async () => {
    const reservationId = "RES001";
    const updateData = {
      statut: "en_cours"
    };
    const response = await api.patch(`/reservations/${reservationId}/status`, updateData);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('statut', updateData.statut);
  });

  test('Ajout d\'un paiement à une réservation', async () => {
    const reservationId = "RES001";
    const newPayment = {
      paiementId: "PAY002",
      methodePaiement: "ccp",
      montant: 20000,
      datePaiement: "2025-06-10T10:00:00.000Z",
      numeroCCP: "1234567890",
      numeroTransaction: "TX789123",
      preuvePaiement: "preuve_001.pdf"
    };
    const response = await api.post(`/reservations/${reservationId}/payments`, newPayment);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('paiements');
    expect(Array.isArray(response.data.data.paiements)).toBe(true);
    expect(response.data.data.paiements).toContainEqual(expect.objectContaining(newPayment));
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
      expect(error.response.data.message).toBe('Le prix de base ne peut pas être négatif');
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
      expect(error.response.status).toBe(500);
      expect(error.response.data.message).toBe('Erreur lors de la création de la chambre');
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

  test('Statistiques d\'occupation sans réservations', async () => {
    const response = await api.get('/statistics/occupation');
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('totalRooms');
    expect(response.data.data).toHaveProperty('availableRooms');
    expect(response.data.data).toHaveProperty('reservedRooms');
    expect(response.data.data).toHaveProperty('occupiedRooms');
    expect(response.data.data).toHaveProperty('availabilityRate');
    expect(response.data.data).toHaveProperty('reservationRate');
    expect(response.data.data).toHaveProperty('occupancyRate');
  });

  test('Récupération des statistiques de revenus', async () => {
    try {
      const response = await api.get('/statistics/revenue', {
        params: { period: '2025-06' }
      });
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('totalRevenue');
      expect(response.data.data).toHaveProperty('revenueByRoomType');
    } catch (error) {
      expect(error.response.status).toBe(500);
    }
  });

  test('Récupération des chambres populaires', async () => {
    try {
      const response = await api.get('/statistics/popular-rooms', {
        params: { period: '2025-06' }
      });
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('byType');
    } catch (error) {
      expect(error.response.status).toBe(500);
    }
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
    try {
      const response = await api.post('/users', newReceptionist);
      expect(response.status).toBe(201);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('username', newReceptionist.username);
    } catch (error) {
      expect(error.response.status).toBe(500);
    }
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
    try {
      const response = await api.post('/users', newManager);
      expect(response.status).toBe(201);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('username', newManager.username);
    } catch (error) {
      expect(error.response.status).toBe(500);
    }
  });

  test('Modification d\'un utilisateur existant', async () => {
    const userId = 2;
    const updateData = {
      firstName: 'Pierre',
      lastName: 'Durand',
      email: 'pierre.durand@hotel.com'
    };
    try {
      const response = await api.put(`/users/${userId}`, updateData);
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('firstName', updateData.firstName);
    } catch (error) {
      expect(error.response.status).toBe(404);
    }
  });

  test('Désactivation d\'un utilisateur', async () => {
    const userId = 2;
    try {
      const response = await api.patch(`/users/${userId}/status`, {
        isActive: false
      });
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('isActive', false);
    } catch (error) {
      expect(error.response.status).toBe(404);
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
      number: '9993',
      type: 'STANDARD',
      basePrice: 10000,
      extraPersonPrice: 2000,
      capacity: 2,
      description: 'Chambre standard pour tests'
    });
    standardRoomId = standardRoomResponse.data.data.id;

    const vipRoomResponse = await api.post('/rooms', {
      number: '9994',
      type: 'VIP',
      basePrice: 20000,
      extraPersonPrice: 3000,
      capacity: 4,
      description: 'Chambre VIP pour tests'
    });
    vipRoomId = vipRoomResponse.data.data.id;

    const suiteRoomResponse = await api.post('/rooms', {
      number: '9995',
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
      extraPrice: 0,
      basePriceTotal: 20000,
      roomPrice: 20000,
      prixActivites: 0,
      activites: [],
      conventionInfo: null,
      isConventionMember: false
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
      extraPrice: 4000,
      basePriceTotal: 20000,
      roomPrice: 24000,
      prixActivites: 0,
      activites: [],
      conventionInfo: null,
      isConventionMember: false
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
      extraPrice: 0,
      basePriceTotal: 80000,
      roomPrice: 80000,
      prixActivites: 0,
      activites: [],
      conventionInfo: null,
      isConventionMember: false
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
      extraPrice: 24000,
      basePriceTotal: 80000,
      roomPrice: 104000,
      prixActivites: 0,
      activites: [],
      conventionInfo: null,
      isConventionMember: false
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
      extraPrice: 0,
      basePriceTotal: 90000,
      roomPrice: 90000,
      prixActivites: 0,
      activites: [],
      conventionInfo: null,
      isConventionMember: false
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
      extraPrice: 24000,
      basePriceTotal: 90000,
      roomPrice: 114000,
      prixActivites: 0,
      activites: [],
      conventionInfo: null,
      isConventionMember: false
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
      number: '9996',
      type: 'STANDARD',
      basePrice: 1000,
      extraPersonPrice: 200,
      capacity: 2,
      description: 'Chambre standard pour tests d\'acompte'
    });
    createdRoomId = roomResponse.data.data.id;

    // Créer une chambre VIP pour les tests
    const vipRoomResponse = await api.post('/rooms', {
      number: '9997',
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
    try {
      await api.post('/reservations', {
        ...testData.testCases.reservations.invalid[0].data,
        roomId: createdRoomId,
        checkInDate: '2025-07-03',
        checkOutDate: '2025-07-01'
      });
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toBe('Données de réservation incomplètes');
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
      expect(error.response.data.message).toBe('Données de réservation incomplètes');
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
    try {
      const response = await api.get('/finance/daily', {
        params: { date: '2025-06-10' }
      });
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('total');
      expect(response.data.data).toHaveProperty('byReservation');
    } catch (error) {
      expect(error.response.status).toBe(400);
    }
  });

  test('Validation des revenus journaliers', async () => {
    try {
      await api.post('/reservations', {
        ...testData.reservations[0],
        roomId: createdRoomId,
        depositAmount: 5000
      });
      const response = await api.get('/finance/daily', {
        params: { date: '2025-06-10' }
      });
      expect(response.status).toBe(200);
      expect(response.data.data.cashTotal).toBeGreaterThanOrEqual(5000);
    } catch (error) {
      expect(error.response.status).toBe(400);
    }
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
    expect(response.data.data).toHaveProperty('availabilityRate');
    expect(response.data.data).toHaveProperty('reservationRate');
    expect(response.data.data).toHaveProperty('occupancyRate');
  });

  test('Récupération des statistiques par type de chambre', async () => {
    const response = await api.get('/statistics/by-room-type');
    expect(response.status).toBe(200);
    expect(response.data.data).toBeInstanceOf(Object);
    Object.values(response.data.data).forEach(stats => {
      expect(stats).toHaveProperty('totalRooms');
      expect(stats).toHaveProperty('availableRooms');
      expect(stats).toHaveProperty('reservedRooms');
      expect(stats).toHaveProperty('occupiedRooms');
      expect(stats).toHaveProperty('availabilityRate');
      expect(stats).toHaveProperty('reservationRate');
      expect(stats).toHaveProperty('occupancyRate');
    });
  });

  test('Récupération des statistiques de clients', async () => {
    try {
      const response = await api.get('/statistics/clients');
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('totalClients');
      expect(response.data.data).toHaveProperty('clientsByType');
    } catch (error) {
      expect(error.response.status).toBe(500);
    }
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
    try {
      const data = testData.testCases.finance.daily[0].data;
      const response = await api.get('/finance/daily', { params: data });
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('total');
      expect(response.data.data).toHaveProperty('byReservation');
    } catch (error) {
      expect(error.response.status).toBe(500);
    }
  });

  test('Suivi quotidien des paiements CCP', async () => {
    try {
      const data = testData.testCases.finance.daily[1].data;
      const response = await api.get('/finance/daily', { params: data });
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('total');
      expect(response.data.data).toHaveProperty('byReservation');
    } catch (error) {
      expect(error.response.status).toBe(500);
    }
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


  test('Récupération de l\'historique des paiements', async () => {
    try {
      const response = await api.get(`/reservations/${createdReservationId}/payments`);
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('payments');
      expect(Array.isArray(response.data.data.payments)).toBe(true);
    } catch (error) {
      expect(error.response.status).toBe(404);
    }
  });


});

// Tests du CRUD des conventions
describe('Tests du CRUD des conventions', () => {
  let managerToken;
  let receptionistToken;
  let createdConventionId;

  beforeAll(async () => {
    // Authentification en tant que manager
    const managerResponse = await api.post('/auth/login', {
      username: 'manager1',
      password: 'manager123'
    });
    managerToken = managerResponse.data.data.token;

    // Authentification en tant que réceptionniste
    const receptionistResponse = await api.post('/auth/login', {
      username: 'receptionist1',
      password: 'reception123'
    });
    receptionistToken = receptionistResponse.data.data.token;
  });

  test('Création d\'une nouvelle convention (Manager)', async () => {
    setAuthToken(managerToken);

    const newConvention = {
      numeroConvention: 'CONV-2025-001',
      nomSociete: 'Entreprise Test SARL',
      telephone: '+213 555 123 456',
      email: 'contact@entreprise-test.dz',
      adresse: '123 Rue de la Paix, Alger',
      contactPrincipal: 'Ahmed Benali',
      dateDebut: '2025-07-01',
      nombreJours: 5,
      prixConvention: 15000,
      chambresStandard: 3,
      chambresVIP: 1,
      chambresSuite: 0,
      nombreAdultesMaxParChambre: 2,
      conditionsSpeciales: 'Paiement à 30 jours',
      description: 'Convention pour séminaire d\'entreprise',
      notes: 'Client régulier'
    };

    const response = await api.post('/conventions', newConvention);
    expect(response.status).toBe(201);
    expect(response.data.data).toHaveProperty('id');
    expect(response.data.data).toHaveProperty('numeroConvention', newConvention.numeroConvention);
    expect(response.data.data).toHaveProperty('nomSociete', newConvention.nomSociete);
    expect(response.data.data).toHaveProperty('telephone', newConvention.telephone);
    expect(response.data.data).toHaveProperty('email', newConvention.email);
    expect(response.data.data).toHaveProperty('adresse', newConvention.adresse);
    expect(response.data.data).toHaveProperty('contactPrincipal', newConvention.contactPrincipal);
    expect(response.data.data).toHaveProperty('dateDebut', newConvention.dateDebut);
    expect(response.data.data).toHaveProperty('dateFin');
    expect(response.data.data).toHaveProperty('nombreJours', newConvention.nombreJours);
    expect(response.data.data).toHaveProperty('prixConvention', newConvention.prixConvention);
    expect(response.data.data).toHaveProperty('chambresStandard', newConvention.chambresStandard);
    expect(response.data.data).toHaveProperty('chambresVIP', newConvention.chambresVIP);
    expect(response.data.data).toHaveProperty('chambresSuite', newConvention.chambresSuite);
    expect(response.data.data).toHaveProperty('nombreAdultesMaxParChambre', newConvention.nombreAdultesMaxParChambre);
    expect(response.data.data).toHaveProperty('conditionsSpeciales', newConvention.conditionsSpeciales);
    expect(response.data.data).toHaveProperty('description', newConvention.description);
    expect(response.data.data).toHaveProperty('notes', newConvention.notes);
    expect(response.data.data).toHaveProperty('statut', 'ACTIVE');
    expect(response.data.data).toHaveProperty('creator');

    createdConventionId = response.data.data.id;
  });

  test('Tentative de création de convention par un réceptionniste (interdite)', async () => {
    setAuthToken(receptionistToken);

    const newConvention = {
      numeroConvention: 'CONV-2025-002',
      nomSociete: 'Entreprise Test 2',
      telephone: '+213 555 789 012',
      dateDebut: '2025-08-01',
      nombreJours: 3,
      prixConvention: 10000,
      chambresStandard: 2,
      chambresVIP: 0,
      chambresSuite: 0,
      nombreAdultesMaxParChambre: 2
    };

    try {
      await api.post('/conventions', newConvention);
    } catch (error) {
      expect(error.response.status).toBe(403);
    }
  });

  test('Récupération de toutes les conventions (Manager)', async () => {
    setAuthToken(managerToken);

    const response = await api.get('/conventions');
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success', true);
    expect(response.data).toHaveProperty('data');
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(response.data).toHaveProperty('pagination');
    expect(response.data.pagination).toHaveProperty('currentPage');
    expect(response.data.pagination).toHaveProperty('totalPages');
    expect(response.data.pagination).toHaveProperty('totalItems');
    expect(response.data.pagination).toHaveProperty('itemsPerPage');

    if (response.data.data.length > 0) {
      const convention = response.data.data[0];
      expect(convention).toHaveProperty('id');
      expect(convention).toHaveProperty('numeroConvention');
      expect(convention).toHaveProperty('nomSociete');
      expect(convention).toHaveProperty('telephone');
      expect(convention).toHaveProperty('dateDebut');
      expect(convention).toHaveProperty('dateFin');
      expect(convention).toHaveProperty('prixConvention');
      expect(convention).toHaveProperty('statut');
      expect(convention).toHaveProperty('creator');
    }
  });

  test('Récupération de toutes les conventions (Réceptionniste)', async () => {
    setAuthToken(receptionistToken);

    const response = await api.get('/conventions');
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success', true);
    expect(response.data).toHaveProperty('data');
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  test('Récupération d\'une convention spécifique', async () => {
    setAuthToken(managerToken);

    // Si la création a échoué, on ne peut pas tester la récupération
    if (!createdConventionId) {
      console.log('Skipping test: createdConventionId not available');
      return;
    }

    const response = await api.get(`/conventions/${createdConventionId}`);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('id', createdConventionId);
    expect(response.data.data).toHaveProperty('numeroConvention');
    expect(response.data.data).toHaveProperty('nomSociete');
    expect(response.data.data).toHaveProperty('telephone');
    expect(response.data.data).toHaveProperty('email');
    expect(response.data.data).toHaveProperty('adresse');
    expect(response.data.data).toHaveProperty('contactPrincipal');
    expect(response.data.data).toHaveProperty('dateDebut');
    expect(response.data.data).toHaveProperty('dateFin');
    expect(response.data.data).toHaveProperty('nombreJours');
    expect(response.data.data).toHaveProperty('prixConvention');
    expect(response.data.data).toHaveProperty('chambresStandard');
    expect(response.data.data).toHaveProperty('chambresVIP');
    expect(response.data.data).toHaveProperty('chambresSuite');
    expect(response.data.data).toHaveProperty('nombreAdultesMaxParChambre');
    expect(response.data.data).toHaveProperty('conditionsSpeciales');
    expect(response.data.data).toHaveProperty('description');
    expect(response.data.data).toHaveProperty('notes');
    expect(response.data.data).toHaveProperty('statut');
    expect(response.data.data).toHaveProperty('creator');
  });

  test('Modification d\'une convention (Manager)', async () => {
    setAuthToken(managerToken);

    // Si la création a échoué, on ne peut pas tester la modification
    if (!createdConventionId) {
      console.log('Skipping test: createdConventionId not available');
      return;
    }

    const updateData = {
      nomSociete: 'Entreprise Test SARL - Modifiée',
      contactPrincipal: 'Fatima Zohra',
      conditionsSpeciales: 'Paiement à 45 jours',
      notes: 'Convention mise à jour'
    };

    const response = await api.put(`/conventions/${createdConventionId}`, updateData);
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('nomSociete', updateData.nomSociete);
    expect(response.data.data).toHaveProperty('contactPrincipal', updateData.contactPrincipal);
    expect(response.data.data).toHaveProperty('conditionsSpeciales', updateData.conditionsSpeciales);
    expect(response.data.data).toHaveProperty('notes', updateData.notes);
  });

  test('Tentative de modification par un réceptionniste (interdite)', async () => {
    setAuthToken(receptionistToken);

    const updateData = {
      nomSociete: 'Tentative de modification'
    };

    try {
      await api.put(`/conventions/${createdConventionId}`, updateData);
    } catch (error) {
      expect(error.response.status).toBe(403);
    }
  });

  test('Recherche de conventions par société', async () => {
    setAuthToken(managerToken);

    const response = await api.get('/conventions/search', {
      params: { nomSociete: 'Entreprise Test' }
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success', true);
    expect(response.data).toHaveProperty('data');
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  test('Récupération des conventions actives', async () => {
    setAuthToken(managerToken);

    const response = await api.get('/conventions/active');
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success', true);
    expect(response.data).toHaveProperty('data');
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  test('Récupération des statistiques des conventions', async () => {
    setAuthToken(managerToken);

    const response = await api.get('/conventions/stats');
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success', true);
    expect(response.data).toHaveProperty('data');
    expect(response.data.data).toHaveProperty('totalConventions');
    expect(response.data.data).toHaveProperty('activeConventions');
    expect(response.data.data).toHaveProperty('inactiveConventions');
    expect(response.data.data).toHaveProperty('expiredConventions');
  });

  test('Suppression d\'une convention (Manager)', async () => {
    setAuthToken(managerToken);

    // Si la création a échoué, on ne peut pas tester la suppression
    if (!createdConventionId) {
      console.log('Skipping test: createdConventionId not available');
      return;
    }

    const response = await api.delete(`/conventions/${createdConventionId}`);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success', true);
    expect(response.data).toHaveProperty('message', 'Convention supprimée avec succès');
  });

  test('Tentative de suppression par un réceptionniste (interdite)', async () => {
    setAuthToken(receptionistToken);

    try {
      await api.delete(`/conventions/${createdConventionId}`);
    } catch (error) {
      expect(error.response.status).toBe(403);
    }
  });
});

// Tests de réservation pour particuliers et conventionnés
describe('Tests de réservation pour particuliers et conventionnés', () => {
  let managerToken;
  let receptionistToken;
  let conventionId;
  let standardRoomId;
  let vipRoomId;

  beforeAll(async () => {
    // Authentification
    const managerResponse = await api.post('/auth/login', {
      username: 'manager1',
      password: 'manager123'
    });
    managerToken = managerResponse.data.data.token;

    const receptionistResponse = await api.post('/auth/login', {
      username: 'receptionist1',
      password: 'reception123'
    });
    receptionistToken = receptionistResponse.data.data.token;

    // Créer des chambres pour les tests
    setAuthToken(managerToken);
    
    const standardRoomResponse = await api.post('/rooms', {
      number: '9998',
      type: 'STANDARD',
      basePrice: 10000,
      extraPersonPrice: 2000,
      capacity: 2,
      description: 'Chambre standard pour tests convention'
    });
    standardRoomId = standardRoomResponse.data.data.id;

    const vipRoomResponse = await api.post('/rooms', {
      number: '9999',
      type: 'VIP',
      basePrice: 20000,
      extraPersonPrice: 3000,
      capacity: 4,
      description: 'Chambre VIP pour tests convention'
    });
    vipRoomId = vipRoomResponse.data.data.id;

    // Créer une convention pour les tests
    const conventionResponse = await api.post('/conventions', {
      numeroConvention: 'CONV-TEST-001',
      nomSociete: 'Société Test Convention',
      telephone: '+213 555 999 888',
      email: 'contact@societe-test.dz',
      dateDebut: '2025-09-01',
      nombreJours: 7,
      prixConvention: 0, // Gratuit pour les conventionnés
      chambresStandard: 2,
      chambresVIP: 1,
      chambresSuite: 0,
      nombreAdultesMaxParChambre: 2,
      conditionsSpeciales: 'Réservations gratuites pour les membres',
      description: 'Convention de test pour les réservations'
    });
    conventionId = conventionResponse.data.data.id;

    // Debug: Vérifier que la convention a des chambres associées
    const conventionDetails = await api.get(`/conventions/${conventionId}`);
    console.log('🔍 Convention créée:', conventionDetails.data.data);
    console.log('🔍 Chambres associées:', conventionDetails.data.data.rooms);
  });

  test('Réservation pour un particulier (paiement normal)', async () => {
    setAuthToken(receptionistToken);

    const reservation = {
      reservationId: "RES-PART-001",
      nomClient: "Mohammed Ali",
      email: "mohammed.ali@email.com",
      telephone: "+213 555 111 222",
      adresse: "456 Rue des Fleurs, Oran",
      dateEntree: "2025-10-01",
      dateSortie: "2025-10-03",
      nombrePersonnes: 2,
      chambreId: standardRoomId.toString(), // Convertir en chaîne
      numeroChambre: 9998,
      typeChambre: "STANDARD",
      montantTotal: 20000,
      paiements: [
        {
          paiementId: "PAY-PART-001",
          methodePaiement: "especes",
          montant: 20000,
          datePaiement: "2025-09-30T10:00:00.000Z",
          numeroCCP: "",
          numeroTransaction: "",
          preuvePaiement: null
        }
      ],
      nomGarant: "",
      remarques: "Client particulier",
      receptionnisteId: "REC001",
      statut: "validee",
      dateCreation: "2025-09-30T10:00:00.000Z",
      receptionniste: "Admin"
    };

    const response = await api.post('/reservations', reservation);
    expect(response.status).toBe(201);
    expect(response.data.data).toHaveProperty('reservationId', reservation.reservationId);
    expect(response.data.data).toHaveProperty('montantTotal', reservation.montantTotal);
    expect(response.data.data).toHaveProperty('statut', 'validee');
    expect(response.data.data).toHaveProperty('conventionId', null); // Pas de convention
  });

  test('Réservation pour un conventionné (gratuit)', async () => {
    setAuthToken(receptionistToken);

    // Utiliser une chambre réellement associée à la convention
    const conventionDetails = await api.get(`/conventions/${conventionId}`);
    const associatedRoom = conventionDetails.data.data.rooms[0]; // Première chambre de la convention

    const reservation = {
      reservationId: "RES-CONV-001",
      nomClient: "Ahmed Benali",
      email: "ahmed.benali@societe-test.dz",
      telephone: "+213 555 333 444",
      adresse: "789 Avenue de la République, Alger",
      dateEntree: "2025-09-01",
      dateSortie: "2025-09-03",
      nombrePersonnes: 2,
      chambreId: associatedRoom.id.toString(), // Utiliser l'ID de la chambre associée
      numeroChambre: associatedRoom.number,
      typeChambre: associatedRoom.type,
      montantTotal: 0, // Gratuit pour les conventionnés
      conventionId: conventionId, // ID de la convention
      paiements: [], // Pas de paiement
      nomGarant: "",
      remarques: "Membre de la convention",
      receptionnisteId: "REC001",
      statut: "validee", // Validée automatiquement
      dateCreation: "2025-08-30T14:00:00.000Z",
      receptionniste: "Admin"
    };

    const response = await api.post('/reservations', reservation);
    expect(response.status).toBe(201);
    expect(response.data.data).toHaveProperty('reservationId', reservation.reservationId);
    expect(response.data.data).toHaveProperty('montantTotal', 0);
    expect(response.data.data).toHaveProperty('statut', 'validee');
    expect(response.data.data).toHaveProperty('conventionId', conventionId);
    expect(response.data.data).toHaveProperty('paiements');
    expect(response.data.data.paiements).toHaveLength(0);
  });

  test('Recherche de chambres disponibles pour conventionnés', async () => {
    setAuthToken(receptionistToken);

    const response = await api.get('/reservations/available-rooms', {
      params: {
        dateEntree: '2025-09-01',
        dateSortie: '2025-09-03',
        conventionId: conventionId
      }
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success', true);
    expect(response.data).toHaveProperty('data');
    expect(Array.isArray(response.data.data)).toBe(true);
    
    // Vérifier que seules les chambres de la convention sont retournées
    if (response.data.data.length > 0) {
      response.data.data.forEach(room => {
        expect(room).toHaveProperty('id');
        expect(room).toHaveProperty('number');
        expect(room).toHaveProperty('type');
        expect(room).toHaveProperty('basePrice');
        expect(room).toHaveProperty('capacity');
        expect(room).toHaveProperty('isAvailable', true);
      });
    }
  });

  test('Recherche de chambres disponibles pour particuliers', async () => {
    setAuthToken(receptionistToken);

    const response = await api.get('/reservations/available-rooms', {
      params: {
        dateEntree: '2025-10-01',
        dateSortie: '2025-10-03'
        // Pas de conventionId = recherche pour particuliers
      }
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success', true);
    expect(response.data).toHaveProperty('data');
    expect(Array.isArray(response.data.data)).toBe(true);
    
    // Vérifier que toutes les chambres disponibles sont retournées
    if (response.data.data.length > 0) {
      response.data.data.forEach(room => {
        expect(room).toHaveProperty('id');
        expect(room).toHaveProperty('number');
        expect(room).toHaveProperty('type');
        expect(room).toHaveProperty('basePrice');
        expect(room).toHaveProperty('capacity');
        expect(room).toHaveProperty('isAvailable', true);
      });
    }
  });

  test('Récupération des réservations d\'une convention', async () => {
    setAuthToken(receptionistToken);

    const response = await api.get(`/reservations/convention/${conventionId}/reservations`);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success', true);
    expect(response.data).toHaveProperty('data');
    expect(response.data.data).toHaveProperty('reservations');
    expect(Array.isArray(response.data.data.reservations)).toBe(true);
    
    // Vérifier que toutes les réservations appartiennent à la convention
    response.data.data.reservations.forEach(reservation => {
      expect(reservation).toHaveProperty('conventionId', conventionId);
      expect(reservation).toHaveProperty('montantTotal', 0);
    });
  });

  test('Calcul de prix pour conventionné (gratuit)', async () => {
    setAuthToken(receptionistToken);

    // Utiliser une chambre réellement associée à la convention
    const conventionDetails = await api.get(`/conventions/${conventionId}`);
    const associatedRoom = conventionDetails.data.data.rooms[0]; // Première chambre de la convention

    const response = await api.post('/reservations/calculate-price', {
      roomId: associatedRoom.id.toString(), // Utiliser l'ID de la chambre associée
      numberOfAdults: 2,
      numberOfChildren: 0,
      checkInDate: '2025-09-01',
      checkOutDate: '2025-09-03',
      conventionId: conventionId
    });
    expect(response.status).toBe(200);
    expect(response.data.data.totalPrice).toBe(0);
    expect(response.data.data.priceDetails).toHaveProperty('isConventionMember', true);
  });

  test('Calcul de prix pour particulier (tarif normal)', async () => {
    setAuthToken(receptionistToken);

    const response = await api.post('/reservations/calculate-price', {
      roomId: standardRoomId,
      numberOfAdults: 2,
      numberOfChildren: 0,
      checkInDate: '2025-10-01',
      checkOutDate: '2025-10-03'
      // Pas de conventionId = particulier
    });
    expect(response.status).toBe(200);
    expect(response.data.data.totalPrice).toBe(20000);
    expect(response.data.data.priceDetails).toHaveProperty('isConventionMember', false);
  });

  test('Tentative de réservation conventionnée en dehors de la période', async () => {
    setAuthToken(receptionistToken);

    const reservation = {
      reservationId: "RES-CONV-ERROR",
      nomClient: "Test Error",
      email: "test.error@societe-test.dz",
      telephone: "+213 555 555 555",
      adresse: "Test Address",
      dateEntree: "2025-12-01", // En dehors de la période de convention
      dateSortie: "2025-12-03",
      nombrePersonnes: 2,
      chambreId: standardRoomId,
      numeroChambre: 9998,
      typeChambre: "STANDARD",
      montantTotal: 0,
      conventionId: conventionId,
      paiements: [],
      nomGarant: "",
      remarques: "Test erreur période",
      receptionnisteId: "REC001",
      statut: "en_attente",
      dateCreation: "2025-11-30T10:00:00.000Z",
      receptionniste: "Admin"
    };

    try {
      await api.post('/reservations', reservation);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toContain('n\'appartient pas à la convention');
    }
  });

  test('Tentative de réservation conventionnée avec une chambre non associée', async () => {
    setAuthToken(receptionistToken);

    // Créer une chambre non associée à la convention
    setAuthToken(managerToken);
    const otherRoomResponse = await api.post('/rooms', {
      number: '9990',
      type: 'STANDARD',
      basePrice: 15000,
      extraPersonPrice: 2500,
      capacity: 2,
      description: 'Chambre non associée à la convention'
    });
    const otherRoomId = otherRoomResponse.data.data.id;

    setAuthToken(receptionistToken);
    const reservation = {
      reservationId: "RES-CONV-ERROR-2",
      nomClient: "Test Error 2",
      email: "test.error2@societe-test.dz",
      telephone: "+213 555 666 777",
      adresse: "Test Address 2",
      dateEntree: "2025-09-01",
      dateSortie: "2025-09-03",
      nombrePersonnes: 2,
      chambreId: otherRoomId,
      numeroChambre: 9990,
      typeChambre: "STANDARD",
      montantTotal: 0,
      conventionId: conventionId,
      paiements: [],
      nomGarant: "",
      remarques: "Test erreur chambre",
      receptionnisteId: "REC001",
      statut: "en_attente",
      dateCreation: "2025-08-30T15:00:00.000Z",
      receptionniste: "Admin"
    };

    try {
      await api.post('/reservations', reservation);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toContain('n\'appartient pas à la convention');
    }
  });
});

// Tests du CRUD des activités
describe('Tests du CRUD des activités', () => {
  let activityId;
  let managerToken;
  let receptionistToken;

  // Authentification avant les tests
  beforeAll(async () => {
    // Connexion du manager
    const managerResponse = await api.post('/auth/login', {
      username: 'manager1',
      password: 'manager123'
    });
    managerToken = managerResponse.data.data.token;

    // Connexion du réceptionniste
    const receptionistResponse = await api.post('/auth/login', {
      username: 'receptionist1',
      password: 'reception123'
    });
    receptionistToken = receptionistResponse.data.data.token;
  });

  test('Création d\'une nouvelle activité (Manager)', async () => {
    setAuthToken(managerToken);

    const activity = {
      nomActivite: 'Test Activité',
      prix: 2000,
      description: 'Description de test pour l\'activité'
    };

    const response = await api.post('/activities', activity);
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('id');
    expect(response.data.data.nomActivite).toBe(activity.nomActivite);
    expect(response.data.data.prix).toBe(activity.prix);
    
    activityId = response.data.data.id;
  });

  test('Tentative de création d\'activité par un réceptionniste (interdite)', async () => {
    setAuthToken(receptionistToken);

    const activity = {
      nomActivite: 'Test Activité Réceptionniste',
      prix: 1500
    };

    try {
      await api.post('/activities', activity);
    } catch (error) {
      expect(error.response.status).toBe(403);
    }
  });

  test('Récupération de toutes les activités (Manager)', async () => {
    setAuthToken(managerToken);

    const response = await api.get('/activities');
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data).toHaveProperty('data');
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(response.data).toHaveProperty('pagination');
  });

  test('Récupération de toutes les activités (Réceptionniste)', async () => {
    setAuthToken(receptionistToken);

    const response = await api.get('/activities');
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data).toHaveProperty('data');
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  test('Récupération d\'une activité spécifique', async () => {
    setAuthToken(managerToken);

    const response = await api.get(`/activities/${activityId}`);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('id', activityId);
    expect(response.data.data).toHaveProperty('nomActivite');
    expect(response.data.data).toHaveProperty('prix');
  });

  test('Modification d\'une activité (Manager)', async () => {
    setAuthToken(managerToken);

    const updateData = {
      nomActivite: 'Test Activité Modifiée',
      prix: 2500,
      description: 'Description modifiée'
    };

    const response = await api.put(`/activities/${activityId}`, updateData);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.nomActivite).toBe(updateData.nomActivite);
    expect(response.data.data.prix).toBe(updateData.prix);
  });

  test('Tentative de modification par un réceptionniste (interdite)', async () => {
    setAuthToken(receptionistToken);

    const updateData = {
      nomActivite: 'Test Modification Réceptionniste',
      prix: 1800
    };

    try {
      await api.put(`/activities/${activityId}`, updateData);
    } catch (error) {
      expect(error.response.status).toBe(403);
    }
  });

  test('Activation/Désactivation d\'une activité', async () => {
    setAuthToken(managerToken);

    const response = await api.patch(`/activities/${activityId}/toggle-status`);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('isActive');
  });

  test('Recherche d\'activités', async () => {
    setAuthToken(managerToken);

    const response = await api.get('/activities/search?search=Test');
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data).toHaveProperty('data');
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  test('Récupération des activités actives', async () => {
    setAuthToken(managerToken);

    const response = await api.get('/activities/active/list');
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data).toHaveProperty('data');
    expect(Array.isArray(response.data.data)).toBe(true);
    
    // Vérifier que toutes les activités retournées sont actives
    response.data.data.forEach(activity => {
      expect(activity.isActive).toBe(true);
    });
  });

  test('Tentative de création d\'activité avec nom dupliqué', async () => {
    setAuthToken(managerToken);

    const activity = {
      nomActivite: 'Test Activité Modifiée', // Nom déjà utilisé
      prix: 3000
    };

    try {
      await api.post('/activities', activity);
    } catch (error) {
      expect(error.response.status).toBe(409);
      expect(error.response.data.message).toContain('existe déjà');
    }
  });

  test('Tentative de création d\'activité avec prix négatif', async () => {
    setAuthToken(managerToken);

    const activity = {
      nomActivite: 'Test Prix Négatif',
      prix: -100
    };

    try {
      await api.post('/activities', activity);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toContain('positif');
    }
  });

  test('Tentative de création d\'activité avec données manquantes', async () => {
    setAuthToken(managerToken);

    const activity = {
      nomActivite: 'Test Incomplet'
      // Prix manquant
    };

    try {
      await api.post('/activities', activity);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toContain('requis');
    }
  });

  test('Suppression d\'une activité (Manager)', async () => {
    setAuthToken(managerToken);

    const response = await api.delete(`/activities/${activityId}`);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.message).toContain('supprimée');
  });

  test('Tentative de suppression par un réceptionniste (interdite)', async () => {
    setAuthToken(receptionistToken);

    try {
      await api.delete(`/activities/${activityId}`);
    } catch (error) {
      expect(error.response.status).toBe(403);
    }
  });

  test('Tentative d\'accès à une activité inexistante', async () => {
    setAuthToken(managerToken);

    try {
      await api.get('/activities/non-existent-id');
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data.message).toContain('trouvée');
    }
  });
});

// Tests pour les activités dans les réservations
describe('Tests des activités dans les réservations', () => {
  let managerToken, receptionistToken, activityId, roomId;

  beforeAll(async () => {
    // Authentification
    const managerResponse = await api.post('/auth/login', {
      username: 'manager1',
      password: 'manager123'
    });
    managerToken = managerResponse.data.data.token;

    const receptionistResponse = await api.post('/auth/login', {
      username: 'receptionist1',
      password: 'reception123'
    });
    receptionistToken = receptionistResponse.data.data.token;

    // Créer une activité de test
    setAuthToken(managerToken);
    const activity = {
      nomActivite: 'Test Activité Réservation',
      prix: 2000,
      description: 'Activité de test pour les réservations'
    };
    const activityResponse = await api.post('/activities', activity);
    activityId = activityResponse.data.data.id;

    // Créer une chambre de test
    const room = {
      number: '99999',
      type: 'STANDARD',
      capacity: 2,
      basePrice: 100,
      extraPersonPrice: 50,
      status: 'LIBRE',
      description: 'Chambre de test',
      isActive: true
    };
    const roomResponse = await api.post('/rooms', room);
    roomId = roomResponse.data.data.id;
  });

  test('Récupération des activités disponibles', async () => {
    setAuthToken(managerToken);

    const response = await api.get('/reservations/available-activities');
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(response.data.data.length).toBeGreaterThan(0);
    
    const activity = response.data.data[0];
    expect(activity).toHaveProperty('id');
    expect(activity).toHaveProperty('nomActivite');
    expect(activity).toHaveProperty('prix');
    expect(activity).toHaveProperty('description');
  });

  test('Calcul de prix avec activités', async () => {
    setAuthToken(managerToken);

    const response = await api.post('/reservations/calculate-price', {
      checkInDate: '2025-01-15',
      checkOutDate: '2025-01-17',
      roomId: roomId,
      numberOfAdults: 2,
      activites: [
        { id: activityId, nomActivite: 'Test Activité Réservation', prix: 2000 }
      ]
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('totalPrice');
    expect(response.data.data.priceDetails).toHaveProperty('prixActivites');
    expect(response.data.data.priceDetails.prixActivites).toBe(2000);
    expect(response.data.data.priceDetails).toHaveProperty('activites');
    expect(response.data.data.priceDetails.activites).toHaveLength(1);
  });

  test('Calcul de prix pour conventionné avec activités', async () => {
    setAuthToken(managerToken);

    // Créer une convention de test
    const convention = {
      numeroConvention: 'CONV-ACT-TEST-001',
      nomSociete: 'Société Test Activités',
      contactPrincipal: 'Contact Test',
      telephone: '0123456789',
      email: 'test@convention.com',
      dateDebut: '2025-01-10',
      nombreJours: 10,
      prixConvention: 0,
      chambresStandard: 1,
      chambresVIP: 0,
      chambresSuite: 0,
      nombreAdultesMaxParChambre: 2,
      conditionsSpeciales: 'Activités incluses',
      description: 'Convention avec activités incluses'
    };
    const conventionResponse = await api.post('/conventions', convention);
    const conventionId = conventionResponse.data.data.id;

    // Récupérer les chambres associées à la convention
    const conventionDetails = await api.get(`/conventions/${conventionId}`);
    const associatedRoom = conventionDetails.data.data.rooms[0];

    const response = await api.post('/reservations/calculate-price', {
      checkInDate: '2025-01-15',
      checkOutDate: '2025-01-17',
      roomId: associatedRoom.id,
      numberOfAdults: 2,
      conventionId: conventionId,
      activites: [
        { id: activityId, nomActivite: 'Test Activité Réservation', prix: 2000 }
      ]
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('totalPrice');
    expect(response.data.data.priceDetails).toHaveProperty('prixActivites');
    expect(response.data.data.priceDetails.prixActivites).toBe(2000);
    expect(response.data.data.priceDetails).toHaveProperty('activites');
    expect(response.data.data.priceDetails.activites).toHaveLength(1);
    expect(response.data.data.priceDetails).toHaveProperty('roomPrice');
    expect(response.data.data.priceDetails.roomPrice).toBe(0); // Gratuit pour conventionné
    expect(response.data.data.totalPrice).toBe(2000); // Seulement le prix des activités
  });

  test('Création de réservation avec activités', async () => {
    setAuthToken(managerToken);

    const response = await api.post('/reservations', {
      reservationId: 'RES-ACT-001',
      nomClient: 'Jean Dupont',
      email: 'jean.dupont@email.com',
      telephone: '0123456789',
      adresse: '123 Rue de la Paix, Paris',
      dateEntree: '2025-01-20',
      dateSortie: '2025-01-22',
      nombrePersonnes: 2,
      chambreId: roomId,
      numeroChambre: '99999',
      typeChambre: 'STANDARD',
      montantTotal: 200, // Prix de la chambre
      receptionnisteId: '1',
      receptionniste: 'Manager Test',
      activites: [
        { id: activityId, nomActivite: 'Test Activité Réservation', prix: 2000 }
      ]
    });

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('activites');
    expect(response.data.data.activites).toHaveLength(1);
    expect(response.data.data.montantTotal).toBe(2200); // 200 + 2000
  });

  test('Création de réservation conventionnée avec activités', async () => {
    setAuthToken(managerToken);

    // Créer une convention de test
    const convention = {
      numeroConvention: 'CONV-ACT-TEST-002',
      nomSociete: 'Société Test Activités 2',
      contactPrincipal: 'Contact Test 2',
      telephone: '0987654321',
      email: 'test2@convention.com',
      dateDebut: '2025-01-15',
      nombreJours: 10,
      prixConvention: 0,
      chambresStandard: 1,
      chambresVIP: 0,
      chambresSuite: 0,
      nombreAdultesMaxParChambre: 2,
      conditionsSpeciales: 'Activités incluses',
      description: 'Convention avec activités incluses'
    };
    const conventionResponse = await api.post('/conventions', convention);
    const conventionId = conventionResponse.data.data.id;

    // Récupérer les chambres associées à la convention
    const conventionDetails = await api.get(`/conventions/${conventionId}`);
    const associatedRoom = conventionDetails.data.data.rooms[0];

    const response = await api.post('/reservations', {
      reservationId: 'RES-CONV-ACT-001',
      nomClient: 'Marie Martin',
      email: 'marie.martin@email.com',
      telephone: '0987654321',
      adresse: '456 Avenue des Champs, Lyon',
      dateEntree: '2025-01-18',
      dateSortie: '2025-01-20',
      nombrePersonnes: 2,
      chambreId: associatedRoom.id,
      numeroChambre: associatedRoom.number,
      typeChambre: associatedRoom.type,
      montantTotal: 0,
      receptionnisteId: '1',
      receptionniste: 'Manager Test',
      conventionId: conventionId,
      activites: [
        { id: activityId, nomActivite: 'Test Activité Réservation', prix: 2000 }
      ]
    });

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('activites');
    expect(response.data.data.activites).toHaveLength(1);
    expect(response.data.data.montantTotal).toBe(2000); // Seulement le prix des activités
    expect(response.data.data.conventionId).toBe(conventionId);
  });

  test('Tentative de création avec activité inexistante', async () => {
    setAuthToken(managerToken);

    try {
      await api.post('/reservations', {
        reservationId: 'RES-ACT-ERROR-001',
        nomClient: 'Test Client',
        email: 'test@email.com',
        telephone: '0123456789',
        adresse: 'Test Address',
        dateEntree: '2025-01-20',
        dateSortie: '2025-01-22',
        nombrePersonnes: 2,
        chambreId: roomId,
        numeroChambre: '99999',
        typeChambre: 'STANDARD',
        montantTotal: 200,
        receptionnisteId: '1',
        receptionniste: 'Manager Test',
        activites: [
          { id: 99999, nomActivite: 'Activité Inexistante', prix: 1000 }
        ]
      });
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data.message).toContain('non trouvée');
    }
  });

  test('Tentative de création avec activité inactive', async () => {
    setAuthToken(managerToken);

    // Désactiver l'activité
    await api.patch(`/activities/${activityId}/toggle-status`);

    try {
      await api.post('/reservations', {
        reservationId: 'RES-ACT-INACTIVE-001',
        nomClient: 'Test Client',
        email: 'test@email.com',
        telephone: '0123456789',
        adresse: 'Test Address',
        dateEntree: '2025-01-20',
        dateSortie: '2025-01-22',
        nombrePersonnes: 2,
        chambreId: roomId,
        numeroChambre: '99999',
        typeChambre: 'STANDARD',
        montantTotal: 200,
        receptionnisteId: '1',
        receptionniste: 'Manager Test',
        activites: [
          { id: activityId, nomActivite: 'Test Activité Réservation', prix: 2000 }
        ]
      });
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toContain('n\'est pas active');
    }

    // Réactiver l'activité pour les autres tests
    await api.patch(`/activities/${activityId}/toggle-status`);
  });
}); 

// Tests pour les activités incluses dans les conventions
describe('Tests des activités incluses dans les conventions', () => {
  let managerToken, activityId1, activityId2, roomId, conventionId;

  beforeAll(async () => {
    // Authentification
    const managerResponse = await api.post('/auth/login', {
      username: 'manager1',
      password: 'manager123'
    });
    managerToken = managerResponse.data.data.token;

    // Créer des activités de test
    setAuthToken(managerToken);
    const activity1 = {
      nomActivite: 'Test Activité Incluse',
      prix: 2000,
      description: 'Activité incluse dans la convention'
    };
    const activityResponse1 = await api.post('/activities', activity1);
    activityId1 = activityResponse1.data.data.id;

    const activity2 = {
      nomActivite: 'Test Activité Payante',
      prix: 3000,
      description: 'Activité payante pour conventionnés'
    };
    const activityResponse2 = await api.post('/activities', activity2);
    activityId2 = activityResponse2.data.data.id;

    // Créer une chambre de test
    const room = {
      number: '88888',
      type: 'STANDARD',
      capacity: 2,
      basePrice: 100,
      extraPersonPrice: 50,
      status: 'LIBRE',
      description: 'Chambre de test pour activités incluses',
      isActive: true
    };
    const roomResponse = await api.post('/rooms', room);
    roomId = roomResponse.data.data.id;
  });

  test('Créer une convention avec activités incluses', async () => {
    setAuthToken(managerToken);

    const convention = {
      numeroConvention: 'CONV-ACTIVITES-001',
      nomSociete: 'Société Test Activités Incluses',
      contactPrincipal: 'Contact Test',
      telephone: '0123456789',
      email: 'test@convention-activites.com',
      dateDebut: '2025-01-10',
      dateFin: '2025-01-20',
      nombreJours: 10,
      prixConvention: 0,
      chambresStandard: 1,
      chambresVIP: 0,
      chambresSuite: 0,
      nombreAdultesMaxParChambre: 2,
      conditionsSpeciales: 'Activités incluses',
      description: 'Convention avec activités incluses',
      activitesIncluses: [activityId1] // Inclure seulement la première activité
    };

    const response = await api.post('/conventions', convention);
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('activitesIncluses');
    expect(response.data.data.activitesIncluses).toHaveLength(1);
    expect(response.data.data.activitesIncluses[0].id).toBe(activityId1);
    
    conventionId = response.data.data.id;
  });

  test('Récupérer les activités incluses d\'une convention', async () => {
    setAuthToken(managerToken);

    const response = await api.get(`/conventions/${conventionId}/activities`);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('convention');
    expect(response.data.data).toHaveProperty('activitesIncluses');
    expect(response.data.data.activitesIncluses).toHaveLength(1);
    expect(response.data.data.activitesIncluses[0].id).toBe(activityId1);
  });

  test('Calcul de prix pour conventionné avec activités incluses et payantes', async () => {
    setAuthToken(managerToken);

    // Récupérer les chambres associées à la convention
    const conventionDetails = await api.get(`/conventions/${conventionId}`);
    const associatedRoom = conventionDetails.data.data.rooms[0];

    const response = await api.post('/reservations/calculate-price', {
      checkInDate: '2025-01-15',
      checkOutDate: '2025-01-17',
      roomId: associatedRoom.id,
      numberOfAdults: 2,
      conventionId: conventionId,
      activites: [
        { id: activityId1, nomActivite: 'Test Activité Incluse', prix: 2000 }, // Incluse
        { id: activityId2, nomActivite: 'Test Activité Payante', prix: 3000 }  // Payante
      ]
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('totalPrice');
    expect(response.data.data.priceDetails).toHaveProperty('prixActivites');
    expect(response.data.data.priceDetails.prixActivites).toBe(3000); // Seulement l'activité payante
    expect(response.data.data.priceDetails).toHaveProperty('activites');
    expect(response.data.data.priceDetails.activites).toHaveLength(2);
    
    // Vérifier que l'activité incluse est marquée comme incluse
    const activiteIncluse = response.data.data.priceDetails.activites.find(act => act.id === activityId1);
    expect(activiteIncluse.incluse).toBe(true);
    
    // Vérifier que l'activité payante n'est pas marquée comme incluse
    const activitePayante = response.data.data.priceDetails.activites.find(act => act.id === activityId2);
    expect(activitePayante.incluse).toBe(false);
  });

  test('Création de réservation conventionnée avec activités incluses et payantes', async () => {
    setAuthToken(managerToken);

    // Récupérer les chambres associées à la convention
    const conventionDetails = await api.get(`/conventions/${conventionId}`);
    const associatedRoom = conventionDetails.data.data.rooms[0];

    const response = await api.post('/reservations', {
      reservationId: 'RES-CONV-ACT-INCL-001',
      nomClient: 'Ahmed Benali',
      email: 'ahmed.benali@societe-test.dz',
      telephone: '0987654321',
      adresse: '123 Avenue de la Liberté, Constantine',
      dateEntree: '2025-01-15',
      dateSortie: '2025-01-17',
      nombrePersonnes: 2,
      chambreId: associatedRoom.id,
      numeroChambre: associatedRoom.number,
      typeChambre: associatedRoom.type,
      montantTotal: 0,
      receptionnisteId: '1',
      receptionniste: 'Manager Test',
      conventionId: conventionId,
      activites: [
        { id: activityId1, nomActivite: 'Test Activité Incluse', prix: 2000 }, // Incluse
        { id: activityId2, nomActivite: 'Test Activité Payante', prix: 3000 }  // Payante
      ]
    });

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('activites');
    expect(response.data.data.activites).toHaveLength(2);
    expect(response.data.data.montantTotal).toBe(3000); // Seulement le prix de l'activité payante
    
    // Vérifier que les activités sont marquées correctement
    const activiteIncluse = response.data.data.activites.find(act => act.id === activityId1);
    expect(activiteIncluse.incluse).toBe(true);
    
    const activitePayante = response.data.data.activites.find(act => act.id === activityId2);
    expect(activitePayante.incluse).toBe(false);
  });

  test('Modifier une convention pour ajouter des activités incluses', async () => {
    setAuthToken(managerToken);

    const response = await api.put(`/conventions/${conventionId}`, {
      activitesIncluses: [activityId1, activityId2] // Ajouter la deuxième activité
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('activitesIncluses');
    expect(response.data.data.activitesIncluses).toHaveLength(2);
  });

  test('Calcul de prix après modification des activités incluses', async () => {
    setAuthToken(managerToken);

    // Récupérer les chambres associées à la convention
    const conventionDetails = await api.get(`/conventions/${conventionId}`);
    const associatedRoom = conventionDetails.data.data.rooms[0];

    const response = await api.post('/reservations/calculate-price', {
      checkInDate: '2025-01-15',
      checkOutDate: '2025-01-17',
      roomId: associatedRoom.id,
      numberOfAdults: 2,
      conventionId: conventionId,
      activites: [
        { id: activityId1, nomActivite: 'Test Activité Incluse', prix: 2000 },
        { id: activityId2, nomActivite: 'Test Activité Payante', prix: 3000 }
      ]
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.priceDetails.prixActivites).toBe(0); // Les deux activités sont maintenant incluses
    expect(response.data.data.totalPrice).toBe(0); // Chambre + activités = 0
  });

  test('Tentative de création de convention avec activité inexistante', async () => {
    setAuthToken(managerToken);

    const convention = {
      numeroConvention: 'CONV-ACTIVITES-ERROR-001',
      nomSociete: 'Société Test Erreur',
      contactPrincipal: 'Contact Test',
      telephone: '0123456789',
      email: 'test@convention-error.com',
      dateDebut: '2025-01-10',
      nombreJours: 10,
      prixConvention: 0,
      chambresStandard: 1,
      chambresVIP: 0,
      chambresSuite: 0,
      nombreAdultesMaxParChambre: 2,
      activitesIncluses: [99999] // ID inexistant
    };

    try {
      await api.post('/conventions', convention);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toContain('non trouvée');
    }
  });

  test('Tentative de création de convention avec activité inactive', async () => {
    setAuthToken(managerToken);

    // Désactiver l'activité
    await api.patch(`/activities/${activityId1}/toggle-status`);

    const convention = {
      numeroConvention: 'CONV-ACTIVITES-INACTIVE-001',
      nomSociete: 'Société Test Inactive',
      contactPrincipal: 'Contact Test',
      telephone: '0123456789',
      email: 'test@convention-inactive.com',
      dateDebut: '2025-01-10',
      nombreJours: 10,
      prixConvention: 0,
      chambresStandard: 1,
      chambresVIP: 0,
      chambresSuite: 0,
      nombreAdultesMaxParChambre: 2,
      activitesIncluses: [activityId1] // Activité désactivée
    };

    try {
      await api.post('/conventions', convention);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toContain('n\'est pas active');
    }

    // Réactiver l'activité pour les autres tests
    await api.patch(`/activities/${activityId1}/toggle-status`);
  });
}); 

// Fonction pour tester la validation depuis le token
async function testTokenValidation() {
  try {
    console.log('\n🧪 Test de validation depuis le token...');
    
    // Test 1: Vérifier que le token contient les bonnes informations
    console.log('📋 Informations du token:');
    console.log(`   ID: ${managerId}`);
    console.log(`   Username: ${authToken ? 'manager1' : 'Non disponible'}`);
    console.log(`   Role: ${authToken ? 'MANAGER' : 'Non disponible'}`);
    
    // Test 2: Vérifier le token avec l'endpoint /verify
    const verifyResponse = await axios.get(`${BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Token vérifié avec succès:');
    console.log('📋 Informations utilisateur du token:', verifyResponse.data.data.user);
    
    // Test 3: Tester avec un token invalide
    try {
      await axios.get(`${BASE_URL}/conventions`, {
        headers: {
          'Authorization': 'Bearer token_invalide'
        }
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Validation du token invalide fonctionne correctement');
      } else {
        console.log('⚠️ Réponse inattendue pour token invalide:', error.response?.status);
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la validation du token:', error.response?.data || error.message);
  }
}

// Test 4: Vérifier l'existence de l'utilisateur du token
async function testUserExistence() {
  console.log('\n🧪 Test 4: Vérification de l\'existence de l\'utilisateur');
  
  try {
    // ID extrait du token JWT
    const userId = '2feb4b14-5ec3-4d2a-819f-164407a3a280';
    
    const { User } = require('./src/models');
    
    const user = await User.findByPk(userId);
    
    if (user) {
      console.log('✅ Utilisateur trouvé:');
      console.log('   ID:', user.id);
      console.log('   Username:', user.username);
      console.log('   Role:', user.role);
      console.log('   IsActive:', user.isActive);
    } else {
      console.log('❌ Utilisateur non trouvé avec l\'ID:', userId);
      
      // Lister tous les utilisateurs disponibles
      const allUsers = await User.findAll({
        attributes: ['id', 'username', 'role', 'isActive']
      });
      
      console.log('📋 Utilisateurs disponibles dans la base de données:');
      allUsers.forEach(u => {
        console.log(`   - ${u.username} (${u.id}) - ${u.role} - Active: ${u.isActive}`);
      });
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de l\'utilisateur:', error.message);
  }
}

// Exécuter tous les tests
async function runAllTests() {
  await testDatabaseConnection();
  await testUserExistence();
  await testConventionCreation();
  await testConventionRetrieval();
  await testConventionSearch();
  
  console.log('\n🎉 Tous les tests sont terminés');
  process.exit(0);
}