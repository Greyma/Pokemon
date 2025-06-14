# API de Gestion Hôtelière

Cette API permet de gérer un système hôtelier complet avec la gestion des chambres, des réservations, des utilisateurs et des statistiques.

## Configuration

- Port: 3001
- Base URL: `http://localhost:3001/api`

## Authentification

Toutes les routes (sauf `/auth/login`) nécessitent un token JWT dans le header :
```
Authorization: Bearer <token>
```

### Routes d'authentification

#### POST /auth/login
Authentifie un utilisateur et retourne un token JWT.

```json
{
  "username": "string",
  "password": "string"
}
```

## Gestion des Chambres

### Routes des chambres

#### GET /rooms
Récupère la liste de toutes les chambres.

#### POST /rooms
Crée une nouvelle chambre (nécessite le rôle MANAGER).

```json
{
  "number": "string",
  "type": "STANDARD|VIP|SUITE",
  "basePrice": number,
  "extraPersonPrice": number,
  "capacity": number,
  "description": "string"
}
```

#### PUT /rooms/:id
Modifie une chambre existante.

```json
{
  "basePrice": number,
  "extraPersonPrice": number,
  "description": "string"
}
```

#### PATCH /rooms/:id/status
Modifie le statut d'une chambre.

```json
{
  "isActive": boolean
}
```

## Gestion des Réservations

### Routes des réservations

#### GET /reservations
Récupère toutes les réservations.

#### POST /reservations
Crée une nouvelle réservation.

```json
{
  "reservationId": "string",
  "nomClient": "string",
  "email": "string",
  "telephone": "string",
  "adresse": "string",
  "dateEntree": "YYYY-MM-DD",
  "dateSortie": "YYYY-MM-DD",
  "nombrePersonnes": number,
  "chambreId": "string",
  "numeroChambre": number,
  "typeChambre": "string",
  "montantTotal": number,
  "paiements": [
    {
      "paiementId": "string",
      "methodePaiement": "especes|ccp",
      "montant": number,
      "datePaiement": "string",
      "numeroCCP": "string",
      "numeroTransaction": "string",
      "preuvePaiement": "string"
    }
  ],
  "nomGarant": "string",
  "remarques": "string",
  "receptionnisteId": "string",
  "statut": "string"
}
```

#### GET /reservations/:id
Récupère une réservation spécifique.

#### PATCH /reservations/:id/status
Modifie le statut d'une réservation.

```json
{
  "statut": "string"
}
```

#### POST /reservations/:id/payments
Ajoute un paiement à une réservation.

```json
{
  "paiementId": "string",
  "methodePaiement": "especes|ccp",
  "montant": number,
  "datePaiement": "string",
  "numeroCCP": "string",
  "numeroTransaction": "string",
  "preuvePaiement": "string"
}
```

### Statuts des Réservations
- `validee` : Réservation confirmée et totalement payée
- `en_cours` : Réservation en attente de paiement total
- `terminee` : Séjour terminé
- `annulee` : Réservation annulée

### Gestion Automatique des Statuts
Le système gère automatiquement les statuts en fonction des paiements :

1. **Création de la réservation** :
   - Si le montant total est payé : statut = `validee`
   - Si le montant total n'est pas payé : statut = `en_cours`

2. **Ajout d'un paiement** :
   - Le système recalcule le total des paiements
   - Si le total atteint ou dépasse le montant total : statut = `validee`
   - Sinon : statut = `en_cours`

### Exemple de Création avec Paiement
```http
POST /api/reservations
Content-Type: application/json
Authorization: Bearer <token>

{
  "reservationId": "RES001",
  "nomClient": "Ahmed Benali",
  "montantTotal": 50000,
  "paiements": [
    {
      "paiementId": "PAY001",
      "methodePaiement": "especes",
      "montant": 50000,
      "datePaiement": "2024-03-20T14:00:00.000Z"
    }
  ]
  // ... autres champs ...
}
```

### Exemple d'Ajout de Paiement
```http
POST /api/reservations/RES001/payments
Content-Type: application/json
Authorization: Bearer <token>

{
  "paiementId": "PAY002",
  "methodePaiement": "especes",
  "montant": 25000,
  "datePaiement": "2024-03-21T10:00:00.000Z"
}
```

### Dates de Réservation
Chaque réservation contient deux types de dates :
1. **Dates prévues** :
   - `dateEntree` : Date d'arrivée prévue
   - `dateSortie` : Date de départ prévue

2. **Dates réelles** :
   - `dateEntreeReelle` : Date effective d'arrivée du client
   - `dateSortieReelle` : Date effective de départ du client

### Mise à jour des Dates Réelles
```http
PATCH /api/reservations/:id/real-dates
Content-Type: application/json
Authorization: Bearer <token>

{
  "dateEntreeReelle": "2024-03-20T14:00:00.000Z",
  "dateSortieReelle": "2024-03-22T12:00:00.000Z"
}
```

Le statut est automatiquement mis à jour :
- `terminee` lorsque la date de sortie réelle est enregistrée

### Annulation des Réservations
```http
PATCH /api/reservations/:id/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "statut": "annulee"
}
```

Règles d'annulation selon le rôle :
- **Réceptionniste** : 
  - Peut annuler uniquement dans les 48h suivant la création de la réservation
  - Message d'erreur : "Impossible d'annuler la réservation après 48h. Veuillez contacter le manager."
- **Manager** :
  - Peut annuler à tout moment
  - Aucune restriction de délai

## Gestion des Utilisateurs

### Routes des utilisateurs

#### POST /users
Crée un nouvel utilisateur (nécessite le rôle MANAGER).

```json
{
  "username": "string",
  "password": "string",
  "role": "RECEPTIONIST|MANAGER",
  "firstName": "string",
  "lastName": "string",
  "email": "string"
}
```

#### PUT /users/:id
Modifie un utilisateur existant.

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string"
}
```

#### PATCH /users/:id/status
Désactive un utilisateur.

```json
{
  "isActive": boolean
}
```

## Statistiques

### Routes des statistiques

#### GET /statistics/occupation
Récupère les statistiques d'occupation.

#### GET /statistics/revenue
Récupère les statistiques de revenus.

```json
{
  "period": "YYYY-MM"
}
```

#### GET /statistics/popular-rooms
Récupère les statistiques des chambres populaires.

```json
{
  "period": "YYYY-MM"
}
```

#### GET /statistics/clients
Récupère les statistiques des clients.

#### GET /statistics/by-room-type
Récupère les statistiques par type de chambre.

## Suivi Financier

### Routes financières

#### GET /finance/daily
Récupère le suivi quotidien des paiements.

```json
{
  "date": "YYYY-MM-DD"
}
```

#### GET /finance/by-receptionist
Récupère le suivi financier par réceptionniste.

```json
{
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD"
}
```

#### GET /finance/by-period
Récupère le suivi financier par période.

```json
{
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD"
}
```

#### GET /finance/employee
Récupère le suivi financier par employé.

## Maintenance

### Routes de maintenance

#### POST /maintenance
Active/désactive le mode maintenance.

```json
{
  "isActive": boolean
}
```

## Codes d'erreur

- 200: Succès
- 201: Création réussie
- 400: Données invalides
- 401: Non authentifié
- 404: Ressource non trouvée
- 500: Erreur serveur

## Rôles et Permissions

- MANAGER: Accès complet à toutes les fonctionnalités
- RECEPTIONIST: Accès limité aux réservations et aux paiements

## Exemples d'utilisation

### Création d'une réservation

```javascript
const response = await axios.post('/api/reservations', {
  reservationId: "RES001",
  nomClient: "Ahmed Benali",
  email: "ahmed.benali@example.com",
  telephone: "+213 555 123 456",
  adresse: "12 Rue de la Liberté, Alger",
  dateEntree: "2025-06-10",
  dateSortie: "2025-06-15",
  nombrePersonnes: 2,
  chambreId: "room_id",
  numeroChambre: 101,
  typeChambre: "STANDARD",
  montantTotal: 40000,
  paiements: [
    {
      paiementId: "PAY001",
      methodePaiement: "especes",
      montant: 40000,
      datePaiement: "2025-06-09T14:30:00.000Z"
    }
  ],
  statut: "validee"
});
```

### Calcul du prix d'une réservation

```javascript
const response = await axios.post('/api/reservations/calculate-price', {
  roomId: "room_id",
  numberOfAdults: 2,
  numberOfChildren: 0,
  checkInDate: "2025-07-01",
  checkOutDate: "2025-07-03"
});
```

### Calcul de l'acompte

```javascript
const response = await axios.post('/api/reservations/calculate-deposit', {
  roomId: "room_id",
  totalPrice: 2000,
  checkInDate: "2025-07-01",
  checkOutDate: "2025-07-03",
  numberOfAdults: 2,
  numberOfChildren: 0
});
```

## Gestion des Fichiers

### Upload des Preuves de Paiement

Il y a deux façons d'envoyer une preuve de paiement :

1. **Lors de la création de la réservation** :
   - Envoyer le fichier PDF directement avec les données de réservation
   - Utiliser `multipart/form-data` avec le champ `preuvePaiement` pour le fichier

```javascript
// Exemple de création de réservation avec preuve de paiement
const formData = new FormData();
formData.append('reservationId', 'RES001');
formData.append('nomClient', 'Ahmed Benali');
// ... autres champs de réservation ...
formData.append('preuvePaiement', pdfFile); // Fichier PDF

const response = await axios.post('/api/reservations', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

2. **Pour une réservation existante** :
   - Utiliser l'endpoint dédié `/api/reservations/upload/payment-proof`
   - Nécessite l'ID de la réservation et l'ID du paiement

```javascript
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('reservationId', 'RES001');
formData.append('paymentId', 'PAY001');

const response = await axios.post('/api/reservations/upload/payment-proof', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

### Structure des Dossiers

Les fichiers PDF sont stockés dans la structure suivante :
```
/uploads/
  └── payments/
      ├── RES001_20250609.pdf
      ├── RES001_PAY001_20250610.pdf
      └── ...
```

### Format des Noms de Fichiers

Les fichiers sont nommés selon le format suivant :
- Pour les réservations : `{reservationId}_{timestamp}.pdf`
- Pour les paiements : `{reservationId}_{paymentId}_{timestamp}.pdf`

### Limitations

- Taille maximale du fichier : 5MB
- Format accepté : PDF uniquement
- Nombre maximum de fichiers par paiement : 1

### Accès aux Fichiers

Les fichiers PDF sont accessibles via l'URL :
```
http://localhost:3001/uploads/payments/{fileName}
```

## Sécurité et Authentification

### Rôles et Permissions
1. **Manager** :
   - Accès complet à toutes les fonctionnalités du système
   - Peut effectuer toutes les opérations de réservation
   - Peut gérer les paiements et les preuves de paiement
   - Peut annuler les réservations à tout moment
   - Peut gérer les utilisateurs

2. **Réceptionniste** :
   - Peut créer et gérer les réservations
   - Peut enregistrer les entrées/sorties des clients
   - Peut gérer les paiements
   - Annulation limitée aux 48h

### Routes Protégées
```javascript
// Routes accessibles à tous les utilisateurs authentifiés
GET /api/reservations/rooms          // Recherche de chambres disponibles
GET /api/reservations               // Liste des réservations
GET /api/reservations/:id           // Détails d'une réservation
POST /api/reservations/calculate-price    // Calcul du prix
POST /api/reservations/calculate-deposit  // Calcul de l'acompte

// Routes accessibles aux réceptionnistes et managers
POST /api/reservations              // Création d'une réservation
PATCH /api/reservations/:id/real-dates    // Mise à jour des dates réelles
POST /api/reservations/:id/payments       // Ajout d'un paiement
POST /api/reservations/upload/payment-proof // Upload d'une preuve de paiement
PATCH /api/reservations/:id/status        // Mise à jour du statut
```

### Headers Requis
```http
Authorization: Bearer <token>
Content-Type: application/json
```

## Recherche de Chambres Disponibles

### Endpoint
```http
GET /api/reservations/rooms
```

### Paramètres de Requête
| Paramètre | Type | Description | Obligatoire |
|-----------|------|-------------|-------------|
| checkIn | string | Date d'arrivée (format: YYYY-MM-DD) | Oui |
| checkOut | string | Date de départ (format: YYYY-MM-DD) | Oui |

### Exemple de Requête
```http
GET /api/reservations/rooms?checkIn=2024-03-20&checkOut=2024-03-22
Authorization: Bearer <token>
```

### Réponse Succès
```json
{
  "success": true,
  "data": [
    {
      "id": "CH001",
      "number": "101",
      "type": "STANDARD",
      "basePrice": 10000,
      "extraPersonPrice": 2000,
      "capacity": 2
    },
    {
      "id": "CH002",
      "number": "201",
      "type": "VIP",
      "basePrice": 15000,
      "extraPersonPrice": 3000,
      "capacity": 3
    }
  ]
}
```

### Réponse Erreur
```json
{
  "success": false,
  "message": "Les dates de check-in et check-out sont requises"
}
```
ou
```json
{
  "success": false,
  "message": "La date de check-out doit être postérieure à la date de check-in"
}
```

### Notes
- Les chambres retournées sont celles qui sont :
  - Actives (`isActive: true`)
  - Non réservées pour la période demandée
  - Non en maintenance
- Les réservations annulées ou terminées ne sont pas prises en compte
- Les dates doivent être valides et le check-out doit être postérieur au check-in

### Exemple d'Utilisation avec Axios
```javascript
const searchAvailableRooms = async (checkIn, checkOut) => {
  try {
    const response = await axios.get('/api/reservations/rooms', {
      params: {
        checkIn: checkIn,
        checkOut: checkOut
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Erreur lors de la recherche des chambres:', error.response.data);
    throw error;
  }
};

// Utilisation
const rooms = await searchAvailableRooms('2024-03-20', '2024-03-22');
```

## Historique des Réservations par Chambre

### Endpoint
```http
GET /api/reservations/room/:roomId/reservations
```

### Paramètres
| Paramètre | Type | Description |
|-----------|------|-------------|
| roomId | string | Identifiant de la chambre |

### Exemple de Requête
```http
GET /api/reservations/room/CH001/reservations
Authorization: Bearer <token>
```

### Réponse Succès
```json
{
  "success": true,
  "data": {
    "room": {
      "id": "CH001",
      "number": "101",
      "type": "STANDARD"
    },
    "stats": {
      "total": 10,
      "enCours": 2,
      "validees": 3,
      "terminees": 4,
      "annulees": 1
    },
    "reservations": [
      {
        "reservationId": "RES001",
        "nomClient": "Ahmed Benali",
        "dateEntree": "2024-03-20T14:00:00.000Z",
        "dateSortie": "2024-03-22T12:00:00.000Z",
        "statut": "validee",
        "montantTotal": 50000,
        "creator": {
          "id": "USR001",
          "nom": "Dupont",
          "prenom": "Jean"
        }
      }
      // ... autres réservations
    ]
  }
}
```

### Réponse Erreur
```json
{
  "success": false,
  "message": "Chambre non trouvée"
}
```

### Notes
- Les réservations sont triées par date de création (du plus récent au plus ancien)
- Les statistiques incluent le nombre total de réservations et leur répartition par statut
- Les informations du créateur de la réservation sont incluses

### Exemple d'Utilisation avec Axios
```javascript
const getRoomReservations = async (roomId) => {
  try {
    const response = await axios.get(`/api/reservations/room/${roomId}/reservations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error.response.data);
    throw error;
  }
};

// Utilisation
const roomData = await getRoomReservations('CH001');
console.log(`Statistiques de la chambre ${roomData.room.number}:`, roomData.stats);
```
