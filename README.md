# 🏨 Complexe Hôtelier - Backend API

API REST complète pour la gestion d'un complexe hôtelier avec gestion des chambres, réservations, conventions, activités et suppléments.

## 📋 Table des matières

- [Technologies](#-technologies)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Structure du projet](#-structure-du-projet)
- [API Endpoints](#-api-endpoints)
- [Authentification](#-authentification)
- [Modèles de données](#-modèles-de-données)
- [Scripts disponibles](#-scripts-disponibles)

## 🛠 Technologies

- **Node.js** >= 16.0.0
- **Express.js** 4.18.2 - Framework web
- **Sequelize** 6.35.2 - ORM pour base de données
- **SQLite** - Base de données légère
- **JWT** - Authentification par tokens
- **bcryptjs** - Hachage des mots de passe
- **express-validator** - Validation des données
- **multer / express-fileupload** - Gestion des fichiers uploadés
- **pdfkit** - Génération de PDF
- **winston** - Logging

## 🚀 Installation

```bash
# Cloner le repository
git clone <repository-url>
cd Pokemon

# Installer les dépendances
npm install

# Initialiser la base de données
npm run init-db

# Démarrer le serveur
npm start
```

## ⚙️ Configuration

Créez un fichier `.env` à la racine du projet :

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=votre_cle_secrete_jwt_tres_longue_et_complexe
JWT_EXPIRATION=24h
```

## 📁 Structure du projet

```
Pokemon/
├── src/
│   ├── index.js              # Point d'entrée de l'application
│   ├── config/
│   │   └── database.js       # Configuration Sequelize & JWT
│   ├── controllers/          # Logique métier
│   │   ├── activityController.js
│   │   ├── conventionController.js
│   │   ├── employeeTrackingController.js
│   │   ├── maintenanceController.js
│   │   ├── reservationController.js
│   │   ├── roomController.js
│   │   ├── statisticsController.js
│   │   ├── supplementController.js
│   │   └── userController.js
│   ├── middleware/           # Middlewares Express
│   │   ├── auth.js           # Authentification JWT
│   │   ├── fileUpload.js     # Gestion des uploads
│   │   └── validation.js     # Validation des données
│   ├── models/               # Modèles Sequelize
│   │   ├── Activity.js
│   │   ├── Convention.js
│   │   ├── ConventionRoom.js
│   │   ├── EmployeeAction.js
│   │   ├── MaintenanceMode.js
│   │   ├── Reservation.js
│   │   ├── Room.js
│   │   ├── Supplement.js
│   │   ├── User.js
│   │   ├── associations.js   # Relations entre modèles
│   │   └── index.js
│   ├── routes/               # Routes API
│   │   ├── activityRoutes.js
│   │   ├── auth.js
│   │   ├── conventionRoutes.js
│   │   ├── employeeTrackingRoutes.js
│   │   ├── financeRoutes.js
│   │   ├── maintenanceRoutes.js
│   │   ├── reservationRoutes.js
│   │   ├── roomRoutes.js
│   │   ├── statisticsRoutes.js
│   │   ├── supplementRoutes.js
│   │   └── users.js
│   ├── services/             # Services métier
│   │   └── conventionService.js
│   └── utils/                # Utilitaires
│       └── priceCalculator.js
├── public/                   # Fichiers statiques
├── init-db.js               # Script d'initialisation DB
├── package.json
└── README.md
```

## 🔌 API Endpoints

### 🔐 Authentification (`/api/auth`)

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| POST | `/login` | Connexion utilisateur | Public |
| GET | `/me` | Profil utilisateur connecté | Authentifié |

### 👥 Utilisateurs (`/api/users`)

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/` | Liste tous les utilisateurs | Manager |
| GET | `/me` | Profil utilisateur connecté | Authentifié |
| GET | `/stats` | Statistiques utilisateurs | Manager |
| GET | `/:id` | Détails d'un utilisateur | Manager |
| POST | `/` | Créer un utilisateur | Manager |
| PUT | `/:id` | Modifier un utilisateur | Manager |
| PATCH | `/:id/status` | Activer/Désactiver | Manager |
| PATCH | `/:id/password` | Changer mot de passe | Manager |
| DELETE | `/:id` | Supprimer un utilisateur | Manager |

### 🛏️ Chambres (`/api/rooms`)

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/` | Liste toutes les chambres | Authentifié |
| GET | `/available` | Chambres disponibles | Authentifié |
| GET | `/:number` | Détails d'une chambre | Authentifié |
| POST | `/` | Créer une chambre | Manager |
| PUT | `/:id` | Modifier une chambre | Manager |
| PATCH | `/:id/status` | Changer le statut | Manager |
| PATCH | `/:id/release` | Libérer une chambre | Manager |
| DELETE | `/:id` | Supprimer une chambre | Manager |

### 📅 Réservations (`/api/reservations`)

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/` | Liste des réservations | Authentifié |
| GET | `/available-rooms` | Chambres disponibles | Authentifié |
| GET | `/available-activities` | Activités disponibles | Authentifié |
| GET | `/available-supplements` | Suppléments disponibles | Authentifié |
| GET | `/:id` | Détails d'une réservation | Authentifié |
| GET | `/room/:roomId/reservations` | Réservations d'une chambre | Authentifié |
| GET | `/convention/:conventionId/reservations` | Réservations d'une convention | Authentifié |
| POST | `/` | Créer une réservation | Réceptionniste/Manager |
| POST | `/calculate-price` | Calculer le prix | Authentifié |
| POST | `/calculate-deposit` | Calculer l'acompte | Authentifié |
| POST | `/:id/payments` | Ajouter un paiement | Réceptionniste/Manager |
| POST | `/upload/payment-proof` | Uploader preuve paiement | Réceptionniste/Manager |
| PATCH | `/:id/status` | Changer le statut | Réceptionniste/Manager |
| PATCH | `/:id/real-dates` | Mettre à jour dates réelles | Réceptionniste/Manager |

### 🏢 Conventions (`/api/conventions`)

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/` | Liste des conventions | Réceptionniste/Manager |
| GET | `/stats` | Statistiques | Réceptionniste/Manager |
| GET | `/search` | Rechercher par société | Réceptionniste/Manager |
| GET | `/active` | Conventions actives | Réceptionniste/Manager |
| GET | `/:id` | Détails d'une convention | Réceptionniste/Manager |
| POST | `/` | Créer une convention | Manager |
| PUT | `/:id` | Modifier une convention | Manager |
| DELETE | `/:id` | Supprimer une convention | Manager |

### 🎯 Activités (`/api/activities`)

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/` | Liste des activités | Réceptionniste/Manager |
| GET | `/search` | Rechercher | Réceptionniste/Manager |
| GET | `/active/list` | Activités actives | Réceptionniste/Manager |
| GET | `/:id` | Détails d'une activité | Réceptionniste/Manager |
| POST | `/` | Créer une activité | Manager |
| PUT | `/:id` | Modifier une activité | Manager |
| DELETE | `/:id` | Supprimer une activité | Manager |

### 🧴 Suppléments (`/api/supplements`)

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/` | Suppléments actifs | Authentifié |
| GET | `/admin` | Tous les suppléments | Manager |
| GET | `/:id` | Détails d'un supplément | Authentifié |
| POST | `/` | Créer un supplément | Manager |
| PUT | `/:id` | Modifier un supplément | Manager |
| PATCH | `/:id/activate` | Activer/Désactiver | Manager |
| DELETE | `/:id` | Supprimer un supplément | Manager |

### 📊 Statistiques (`/api/statistics`)

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/revenue` | Statistiques revenus | Manager |
| GET | `/occupation` | Taux d'occupation | Manager |
| GET | `/by-room-type` | Stats par type de chambre | Manager |

### 👷 Suivi Employés (`/api/employee-tracking`)

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/` | Actions des employés | Manager |
| POST | `/` | Enregistrer une action | Authentifié |

### 🔧 Maintenance (`/api/maintenance`)

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/status` | État du mode maintenance | Public |
| POST | `/toggle` | Activer/Désactiver | Manager |

## 🔒 Authentification

L'API utilise l'authentification JWT (JSON Web Tokens).

### Exemple de connexion

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "manager1",
  "password": "manager123"
}
```

### Réponse

```json
{
  "status": "success",
  "message": "Connexion réussie",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "username": "manager1",
      "firstName": "Manager",
      "lastName": "Principal",
      "email": "manager1@hotel.local",
      "role": "MANAGER"
    }
  }
}
```

### Utiliser le token

Ajoutez le token dans le header de vos requêtes :

```
Authorization: Bearer <token>
```

## 📊 Modèles de données

### User (Utilisateur)
- `id` (UUID) - Identifiant unique
- `username` (String) - Nom d'utilisateur unique
- `password` (String) - Mot de passe hashé
- `firstName`, `lastName` (String) - Prénom et nom
- `email` (String) - Email unique
- `phone` (String) - Téléphone (optionnel)
- `role` (Enum) - MANAGER | RECEPTIONIST
- `isActive` (Boolean) - Compte actif
- `lastLogin` (Date) - Dernière connexion

### Room (Chambre)
- `id` (UUID) - Identifiant unique
- `number` (String) - Numéro de chambre unique
- `type` (Enum) - STANDARD | VIP | SUITE
- `basePrice` (Decimal) - Prix de base
- `extraPersonPrice` (Decimal) - Prix personne supplémentaire
- `childPrice` (Decimal) - Prix enfant
- `capacity` (Integer) - Capacité maximale
- `description` (Text) - Description
- `status` (Enum) - LIBRE | OCCUPÉE | RÉSERVÉE | MAINTENANCE
- `isActive` (Boolean) - Chambre active

### Reservation
- `id` (UUID) - Identifiant unique
- `roomId` (UUID) - Référence chambre
- `conventionId` (UUID) - Référence convention (optionnel)
- `clientName`, `clientPhone`, `clientEmail` - Infos client
- `checkIn`, `checkOut` (Date) - Dates prévues
- `realCheckIn`, `realCheckOut` (Date) - Dates réelles
- `numberOfGuests`, `numberOfChildren` (Integer) - Nombre de personnes
- `totalPrice` (Decimal) - Prix total
- `status` (Enum) - PENDING | CONFIRMED | CHECKED_IN | CHECKED_OUT | CANCELLED

### Convention
- `id` (UUID) - Identifiant unique
- `nomSociete` (String) - Nom de la société
- `dateDebut`, `dateFin` (Date) - Période de validité
- `remise` (Decimal) - Pourcentage de remise
- `isActive` (Boolean) - Convention active

### Activity (Activité)
- `id` (UUID) - Identifiant unique
- `nomActivite` (String) - Nom de l'activité
- `prix` (Decimal) - Prix
- `description` (Text) - Description
- `imagePath` (String) - Chemin image
- `isActive` (Boolean) - Activité active

### Supplement
- `id` (UUID) - Identifiant unique
- `name` (String) - Nom du supplément
- `price` (Decimal) - Prix
- `description` (Text) - Description
- `isActive` (Boolean) - Supplément actif

## 🎮 Scripts disponibles

```bash
# Démarrer le serveur en production
npm start

# Démarrer en mode développement (avec nodemon)
npm run dev

# Initialiser/Réinitialiser la base de données
npm run init-db

# Exécuter les tests
npm test

# Exécuter les tests API
npm run test:api
```

## 👤 Comptes par défaut

Après l'initialisation de la base de données :

| Rôle | Username | Password |
|------|----------|----------|
| Manager | manager1 | manager123 |
| Réceptionniste | receptionist1 | reception123 |

## 📝 Licence

ISC

---

Développé avec ❤️ pour la gestion hôtelière
