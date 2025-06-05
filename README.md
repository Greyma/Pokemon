# Système de Gestion de Complexe Hôtelier

Ce projet est un système de gestion de complexe hôtelier qui permet de gérer les réservations, les chambres et les utilisateurs.

## Fonctionnalités

- Gestion des chambres (VIP et standard)
- Système de réservation
- Gestion des utilisateurs (Réceptionniste et Gérant)
- Système de paiement (CCP et liquide)
- Statistiques et rapports
- Gestion des fichiers PDF pour les justificatifs CCP

## Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn

## Installation

1. Cloner le repository :
```bash
git clone [URL_DU_REPO]
cd complexe-hotel-backend
```

2. Installer les dépendances :
```bash
npm install
```

3. Créer un fichier `.env` à la racine du projet avec les variables suivantes :
```
JWT_SECRET=votre_secret_jwt_super_securise
JWT_EXPIRATION=24h

PORT=3000
NODE_ENV=development
```

4. Démarrer le serveur :
```bash
npm run dev
```

La base de données SQLite sera automatiquement créée lors du premier démarrage de l'application.

## Structure du Projet

```
src/
├── config/         # Configuration de la base de données
├── middleware/     # Middleware d'authentification
├── models/         # Modèles de données
├── routes/         # Routes de l'API
└── index.js        # Point d'entrée de l'application
```

## API Endpoints

### Authentification
- POST /api/auth/login - Connexion
- GET /api/auth/verify - Vérification du token

### Chambres
- GET /api/rooms - Liste des chambres
- GET /api/rooms/available - Chambres disponibles
- POST /api/rooms - Créer une chambre (Manager)
- PUT /api/rooms/:id - Mettre à jour une chambre (Manager)
- DELETE /api/rooms/:id - Désactiver une chambre (Manager)

### Réservations
- POST /api/reservations - Créer une réservation
- GET /api/reservations - Liste des réservations
- GET /api/reservations/:id - Détails d'une réservation
- PATCH /api/reservations/:id/payment - Mettre à jour le statut de paiement
- POST /api/reservations/:id/ccp-proof - Upload du justificatif CCP

### Utilisateurs
- GET /api/users - Liste des utilisateurs (Manager)
- POST /api/users - Créer un utilisateur (Manager)
- PUT /api/users/:id - Mettre à jour un utilisateur (Manager)
- DELETE /api/users/:id - Désactiver un utilisateur (Manager)
- GET /api/users/stats - Statistiques d'activité (Manager)

## Sécurité

- Authentification JWT
- Hachage des mots de passe avec bcrypt
- Validation des données
- Gestion des rôles (Réceptionniste/Gérant)

## Développement

Pour le développement, le serveur redémarre automatiquement grâce à nodemon.

```bash
npm run dev
```

## Production

Pour la production, utilisez :

```bash
npm start
```

## Tests

Pour lancer les tests :

```bash
npm test
```

# API de Gestion Hôtelière

## Authentification

### Connexion
```http
POST /api/auth/login
```
**Corps de la requête :**
```json
{
  "username": "string",
  "password": "string"
}
```
**Réponse :**
```json
{
  "status": "success",
  "data": {
    "token": "string",
    "user": {
      "id": "uuid",
      "username": "string",
      "role": "MANAGER|RECEPTIONIST"
    }
  }
}
```

### Vérification du Token
```http
GET /api/auth/verify
```
**Headers :**
```
Authorization: Bearer <token>
```
**Réponse :**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "role": "MANAGER|RECEPTIONIST"
    }
  }
}
```

## Gestion des Utilisateurs (Manager uniquement)

### Liste des Utilisateurs
```http
GET /api/users
```
**Headers :**
```
Authorization: Bearer <token>
```
**Réponse :**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "username": "string",
      "role": "MANAGER|RECEPTIONIST",
      "isActive": boolean,
      "lastLogin": "date",
      "createdAt": "date"
    }
  ]
}
```

### Création d'un Utilisateur
```http
POST /api/users
```
**Headers :**
```
Authorization: Bearer <token>
```
**Corps de la requête :**
```json
{
  "username": "string",
  "password": "string",
  "role": "MANAGER|RECEPTIONIST"
}
```
**Réponse :**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "username": "string",
    "role": "MANAGER|RECEPTIONIST"
  }
}
```

### Statistiques des Utilisateurs
```http
GET /api/users/stats
```
**Headers :**
```
Authorization: Bearer <token>
```
**Réponse :**
```json
{
  "status": "success",
  "data": {
    "totalUsers": number,
    "activeUsers": number,
    "managers": number,
    "receptionists": number
  }
}
```

## Gestion des Chambres

### Liste des Chambres
```http
GET /api/rooms
```
**Headers :**
```
Authorization: Bearer <token>
```
**Réponse :**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "number": "string",
      "type": "STANDARD|VIP|SUITE",
      "basePrice": number,
      "status": "LIBRE|OCCUPEE|MAINTENANCE",
      "description": "string",
      "capacity": number,
      "amenities": ["string"]
    }
  ]
}
```

### Création d'une Chambre (Manager uniquement)
```http
POST /api/rooms
```
**Headers :**
```
Authorization: Bearer <token>
```
**Corps de la requête :**
```json
{
  "number": "string",
  "type": "STANDARD|VIP|SUITE",
  "basePrice": number,
  "status": "LIBRE|OCCUPEE|MAINTENANCE",
  "description": "string",
  "capacity": number,
  "amenities": ["string"]
}
```
**Réponse :**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "number": "string",
    "type": "STANDARD|VIP|SUITE",
    "basePrice": number,
    "status": "LIBRE|OCCUPEE|MAINTENANCE",
    "description": "string",
    "capacity": number,
    "amenities": ["string"]
  }
}
```

### Chambres Disponibles
```http
GET /api/rooms/available
```
**Headers :**
```
Authorization: Bearer <token>
```
**Réponse :**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "number": "string",
      "type": "STANDARD|VIP|SUITE",
      "basePrice": number,
      "status": "LIBRE",
      "description": "string",
      "capacity": number,
      "amenities": ["string"]
    }
  ]
}
```

### Mise à jour d'une Chambre (Manager uniquement)
```http
PUT /api/rooms/:id
```
**Headers :**
```
Authorization: Bearer <token>
```
**Corps de la requête :**
```json
{
  "basePrice": number,
  "status": "LIBRE|OCCUPEE|MAINTENANCE",
  "description": "string"
}
```
**Réponse :**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "number": "string",
    "type": "STANDARD|VIP|SUITE",
    "basePrice": number,
    "status": "LIBRE|OCCUPEE|MAINTENANCE",
    "description": "string",
    "capacity": number,
    "amenities": ["string"]
  }
}
```

## Gestion des Réservations

### Liste des Réservations
```http
GET /api/reservations
```
**Headers :**
```
Authorization: Bearer <token>
```
**Réponse :**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "clientName": "string",
      "clientType": "PRESENTIEL|ONLINE",
      "numberOfAdults": number,
      "checkInDate": "date",
      "checkOutDate": "date",
      "totalPrice": number,
      "paymentMethod": "CASH|CCP",
      "paymentStatus": "PENDING|COMPLETED",
      "specialRequests": "string",
      "contactPhone": "string",
      "contactEmail": "string",
      "roomId": "uuid",
      "createdBy": "uuid"
    }
  ]
}
```

### Création d'une Réservation
```http
POST /api/reservations
```
**Headers :**
```
Authorization: Bearer <token>
```
**Corps de la requête :**
```json
{
  "clientName": "string",
  "clientType": "PRESENTIEL|ONLINE",
  "numberOfAdults": number,
  "checkInDate": "date",
  "checkOutDate": "date",
  "paymentMethod": "CASH|CCP",
  "paymentStatus": "PENDING|COMPLETED",
  "specialRequests": "string",
  "contactPhone": "string",
  "contactEmail": "string",
  "roomId": "uuid"
}
```
**Réponse :**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "clientName": "string",
    "clientType": "PRESENTIEL|ONLINE",
    "numberOfAdults": number,
    "checkInDate": "date",
    "checkOutDate": "date",
    "totalPrice": number,
    "paymentMethod": "CASH|CCP",
    "paymentStatus": "PENDING|COMPLETED",
    "specialRequests": "string",
    "contactPhone": "string",
    "contactEmail": "string",
    "roomId": "uuid",
    "createdBy": "uuid"
  }
}
```

## Codes d'Erreur

- `400` : Requête invalide (données manquantes ou invalides)
- `401` : Non authentifié (token manquant ou invalide)
- `403` : Non autorisé (rôle insuffisant)
- `404` : Ressource non trouvée
- `500` : Erreur serveur

## Messages d'Erreur Courants

- "Données utilisateur incomplètes"
- "Rôle utilisateur invalide"
- "Ce nom d'utilisateur existe déjà"
- "Données de chambre incomplètes"
- "Type de chambre invalide"
- "Ce numéro de chambre existe déjà"
- "Le prix de base doit être positif"
- "Données de réservation incomplètes"
- "La date de départ doit être postérieure à la date d'arrivée"
- "Le nombre d'adultes doit être supérieur à 0"
- "Accès non autorisé"
- "Token d'authentification manquant"
- "Token invalide" 