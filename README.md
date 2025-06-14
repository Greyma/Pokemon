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
