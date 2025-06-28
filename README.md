# Système de Gestion Hôtelière - Conventions, Réservations et Activités

## 📋 Table des matières

- [Présentation](#présentation)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Système de Conventions](#système-de-conventions)
- [Système de Réservations](#système-de-réservations)
- [Système d'Activités](#système-dactivités)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Tests](#tests)

## 🏨 Présentation

Ce système de gestion hôtelière permet de gérer les conventions, réservations et activités avec les fonctionnalités suivantes :

- **Gestion des conventions** : Création, modification, suppression de conventions avec attribution automatique des chambres
- **Réservations pour particuliers** : Système de réservation classique avec paiement
- **Réservations pour conventionnés** : Réservations gratuites pour les membres de conventions
- **Gestion des chambres** : Attribution automatique selon les critères de la convention
- **Gestion des activités** : CRUD complet pour les activités hôtelières (piscine, spa, restaurant, etc.)
- **Calcul de prix** : Tarification automatique selon le type de client

### Utilisateurs par défaut

Le script `init-db.js` crée automatiquement :

- **Manager** : `manager1` / `manager123`
- **Réceptionniste** : `receptionist1` / `receptionist123`

## 📚 API Documentation

### Authentification

Toutes les routes nécessitent une authentification JWT.

```bash
# Connexion
POST /api/auth/login
{
  "username": "manager1",
  "password": "manager123"
}
```

### Headers requis
```
Authorization: Bearer <token>
Content-Type: application/json
```

## 🏢 Système de Conventions

### Création d'une convention

```bash
POST /api/conventions
```

**Corps de la requête :**
```json
{
  "numeroConvention": "CONV-2025-001",
  "nomSociete": "Entreprise ABC",
  "telephone": "+213 555 123 456",
  "email": "contact@entreprise-abc.dz",
  "dateDebut": "2025-09-01",
  "nombreJours": 7,
  "prixConvention": 0,
  "chambresStandard": 5,
  "chambresVIP": 2,
  "chambresSuite": 1,
  "nombreAdultesMaxParChambre": 2,
  "conditionsSpeciales": "Réservations gratuites pour les employés",
  "description": "Convention annuelle de l'entreprise",
  "activitesIncluses": [1, 2, 3] // IDs des activités incluses gratuitement
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Convention créée avec succès",
  "data": {
    "id": "uuid",
    "numeroConvention": "CONV-2025-001",
    "nomSociete": "Entreprise ABC",
    "dateDebut": "2025-09-01",
    "dateFin": "2025-09-07",
    "chambresStandard": 5,
    "chambresVIP": 2,
    "chambresSuite": 1,
    "activitesIncluses": [
      {
        "id": 1,
        "nomActivite": "Piscine",
        "prix": 1500,
        "description": "Accès à la piscine avec serviettes incluses"
      },
      {
        "id": 2,
        "nomActivite": "Spa & Massage",
        "prix": 5000,
        "description": "Séance de spa et massage relaxant"
      }
    ],
    "rooms": [
      {
        "id": "room-uuid-1",
        "number": "101",
        "type": "STANDARD"
      }
      // ... autres chambres attribuées automatiquement
    ],
    "roomSelectionDetails": {
      "STANDARD": {
        "needed": 5,
        "selected": 5,
        "rooms": [
          {
            "id": 1,
            "number": "101",
            "type": "STANDARD",
            "basePrice": 5000,
            "capacity": 2
          }
          // ... autres chambres STANDARD
        ]
      },
      "VIP": {
        "needed": 2,
        "selected": 2,
        "rooms": [
          {
            "id": 15,
            "number": "201",
            "type": "VIP",
            "basePrice": 8000,
            "capacity": 3
          }
          // ... autres chambres VIP
        ]
      },
      "SUITE": {
        "needed": 1,
        "selected": 1,
        "rooms": [
          {
            "id": 25,
            "number": "301",
            "type": "SUITE",
            "basePrice": 12000,
            "capacity": 4
          }
        ]
      },
      "totalSelected": 8,
      "totalNeeded": 8
    }
  }
}
```

### Obtenir toutes les conventions avec leurs chambres

**GET** `/api/conventions`

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "numeroConvention": "CONV-2025-001",
      "nomSociete": "Entreprise ABC",
      "dateDebut": "2025-09-01",
      "dateFin": "2025-09-07",
      "statut": "ACTIVE",
      "creator": {
        "id": "user-uuid",
        "username": "manager1",
        "role": "MANAGER"
      },
      "rooms": [
        {
          "id": 1,
          "number": "101",
          "type": "STANDARD",
          "basePrice": 5000,
          "extraPersonPrice": 1000,
          "capacity": 2,
          "isActive": true,
          "status": "DISPONIBLE"
        }
        // ... autres chambres
      ]
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

### Obtenir les détails complets d'une convention

**GET** `/api/conventions/:id/details`

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "numeroConvention": "CONV-2025-001",
    "nomSociete": "Entreprise ABC",
    "dateDebut": "2025-09-01",
    "dateFin": "2025-09-07",
    "statut": "ACTIVE",
    "creator": {
      "id": "user-uuid",
      "username": "manager1",
      "role": "MANAGER"
    },
    "rooms": [
      {
        "id": 1,
        "number": "101",
        "type": "STANDARD",
        "basePrice": 5000,
        "extraPersonPrice": 1000,
        "capacity": 2,
        "isActive": true,
        "status": "DISPONIBLE"
      }
      // ... autres chambres
    ],
    "roomStats": {
      "total": 8,
      "byType": {
        "STANDARD": 5,
        "VIP": 2,
        "SUITE": 1
      },
      "active": 8,
      "reserved": 0
    }
  }
}
```

### Fonctionnalités des conventions

- **Attribution automatique des chambres** : Les chambres sont automatiquement sélectionnées selon les critères de la convention
- **Vérification de disponibilité** : Le système vérifie que les chambres sont disponibles pour la période
- **Gestion des statuts** : ACTIVE, INACTIVE, EXPIRED
- **Activités incluses** : Possibilité d'inclure des activités gratuitement dans la convention

### Récupération des activités incluses d'une convention

```bash
GET /api/conventions/:id/activities
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "convention": {
      "id": "uuid",
      "numeroConvention": "CONV-2025-001",
      "nomSociete": "Entreprise ABC"
    },
    "activitesIncluses": [
      {
        "id": 1,
        "nomActivite": "Piscine",
        "prix": 1500,
        "description": "Accès à la piscine avec serviettes incluses"
      },
      {
        "id": 2,
        "nomActivite": "Spa & Massage",
        "prix": 5000,
        "description": "Séance de spa et massage relaxant"
      }
    ]
  }
}
```

### Routes disponibles

| Méthode | Route | Description | Rôle requis |
|---------|-------|-------------|-------------|
| POST | `/api/conventions` | Créer une convention | MANAGER |
| GET | `/api/conventions` | Lister toutes les conventions | MANAGER, RECEPTIONIST |
| GET | `/api/conventions/:id` | Détails d'une convention | MANAGER, RECEPTIONIST |
| PUT | `/api/conventions/:id` | Modifier une convention | MANAGER |
| DELETE | `/api/conventions/:id` | Supprimer une convention | MANAGER |
| GET | `/api/conventions/search` | Rechercher par société | MANAGER, RECEPTIONIST |
| GET | `/api/conventions/active` | Conventions actives | MANAGER, RECEPTIONIST |
| GET | `/api/conventions/stats` | Statistiques | MANAGER, RECEPTIONIST |
| GET | `/api/conventions/:id/activities` | Activités incluses | MANAGER, RECEPTIONIST |

## 🛏️ Système de Réservations

### Réservation pour particulier

```bash
POST /api/reservations
```

**Corps de la requête :**
```json
{
  "reservationId": "RES-2025-001",
  "nomClient": "Mohammed Ali",
  "email": "mohammed.ali@email.com",
  "telephone": "+213 555 111 222",
  "adresse": "123 Rue des Fleurs, Alger",
  "dateEntree": "2025-10-01",
  "dateSortie": "2025-10-03",
  "nombrePersonnes": 2,
  "chambreId": "room-uuid",
  "numeroChambre": 101,
  "typeChambre": "STANDARD",
  "montantTotal": 20000,
  "paiements": [
    {
      "paiementId": "PAY-001",
      "methodePaiement": "especes",
      "montant": 20000,
      "datePaiement": "2025-09-30T10:00:00.000Z"
    }
  ],
  "nomGarant": "Ali Benali",
  "remarques": "Arrivée tardive",
  "receptionnisteId": "REC001",
  "receptionniste": "Admin"
}
```

### Réservation pour conventionné (gratuit)

```bash
POST /api/reservations
```

**Corps de la requête :**
```json
{
  "reservationId": "RES-CONV-001",
  "nomClient": "Ahmed Benali",
  "email": "ahmed.benali@societe-test.dz",
  "telephone": "+213 555 333 444",
  "adresse": "789 Avenue de la République, Alger",
  "dateEntree": "2025-09-01",
  "dateSortie": "2025-09-03",
  "nombrePersonnes": 2,
  "chambreId": "room-uuid-from-convention",
  "numeroChambre": 101,
  "typeChambre": "STANDARD",
  "montantTotal": 0,
  "conventionId": "convention-uuid",
  "paiements": [],
  "nomGarant": "",
  "remarques": "Membre de la convention",
  "receptionnisteId": "REC001",
  "receptionniste": "Admin"
}
```

### Calcul de prix

```bash
POST /api/reservations/calculate-price
```

**Corps de la requête :**
```json
{
  "checkInDate": "2025-10-01",
  "checkOutDate": "2025-10-03",
  "roomId": "room-uuid",
  "numberOfAdults": 2,
  "numberOfChildren": 0,
  "conventionId": "convention-uuid", // Optionnel
  "activites": [ // Optionnel - Liste des activités sélectionnées
    {
      "id": 1,
      "nomActivite": "Piscine",
      "prix": 1500
    },
    {
      "id": 2,
      "nomActivite": "Spa & Massage",
      "prix": 5000
    }
  ]
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "totalPrice": 26500,
    "priceDetails": {
      "basePrice": 10000, // Prix de base par nuit
      "extraPersonPrice": 2000, // Prix par personne supplémentaire
      "nights": 2,
      "capacity": 2,
      "extraAdults": 0,
      "basePriceTotal": 20000, // Prix de base × nombre de nuits
      "extraPrice": 0,
      "roomPrice": 20000, // Prix total de la chambre
      "prixActivites": 6500, // Prix total des activités
      "activites": [
        {
          "id": 1,
          "nomActivite": "Piscine",
          "prix": 1500,
          "description": "Accès à la piscine avec serviettes incluses",
          "incluse": false // false = payante, true = gratuite (si conventionnée)
        },
        {
          "id": 2,
          "nomActivite": "Spa & Massage",
          "prix": 5000,
          "description": "Séance de spa et massage relaxant",
          "incluse": false
        }
      ],
      "isConventionMember": false,
      "conventionInfo": null // Informations de la convention si applicable
    }
  }
}
```

### Réservation avec activités

**Corps de la requête :**
```json
{
  "reservationId": "RES-ACT-2025-001",
  "nomClient": "Fatima Zahra",
  "email": "fatima.zahra@email.com",
  "telephone": "+213 555 555 666",
  "adresse": "456 Rue de la Paix, Oran",
  "dateEntree": "2025-10-01",
  "dateSortie": "2025-10-03",
  "nombrePersonnes": 2,
  "chambreId": "room-uuid",
  "numeroChambre": 101,
  "typeChambre": "STANDARD",
  "montantTotal": 20000, // Prix de la chambre uniquement
  "receptionnisteId": "REC001",
  "receptionniste": "Admin",
  "activites": [ // Les activités seront ajoutées au prix total
    {
      "id": 1,
      "nomActivite": "Piscine",
      "prix": 1500
    },
    {
      "id": 3,
      "nomActivite": "Restaurant Gastronomique",
      "prix": 3000
    }
  ]
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "reservationId": "RES-ACT-2025-001",
    "nomClient": "Fatima Zahra",
    "montantTotal": 24500, // 20000 + 1500 + 3000
    "activites": [
      {
        "id": 1,
        "nomActivite": "Piscine",
        "prix": 1500,
        "description": "Accès à la piscine avec serviettes incluses",
        "incluse": false
      },
      {
        "id": 3,
        "nomActivite": "Restaurant Gastronomique",
        "prix": 3000,
        "description": "Menu gastronomique avec vue panoramique",
        "incluse": false
      }
    ]
  }
}
```

### Réservation conventionnée avec activités

Pour les membres de conventions, la chambre est gratuite mais les activités restent payantes :

```json
{
  "reservationId": "RES-CONV-ACT-001",
  "nomClient": "Karim Benali",
  "email": "karim.benali@societe-test.dz",
  "telephone": "+213 555 777 888",
  "adresse": "123 Avenue de la Liberté, Constantine",
  "dateEntree": "2025-09-01",
  "dateSortie": "2025-09-03",
  "nombrePersonnes": 2,
  "chambreId": "room-uuid-from-convention",
  "numeroChambre": 101,
  "typeChambre": "STANDARD",
  "montantTotal": 0, // Chambre gratuite
  "conventionId": "convention-uuid",
  "receptionnisteId": "REC001",
  "receptionniste": "Admin",
  "activites": [
    {
      "id": 2,
      "nomActivite": "Spa & Massage",
      "prix": 5000
    }
  ]
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "reservationId": "RES-CONV-ACT-001",
    "nomClient": "Karim Benali",
    "montantTotal": 5000, // Seulement le prix des activités
    "conventionId": "convention-uuid",
    "activites": [
      {
        "id": 2,
        "nomActivite": "Spa & Massage",
        "prix": 5000,
        "description": "Séance de spa et massage relaxant",
        "incluse": false
      }
    ]
  }
}
```

### Réservation conventionnée avec activités incluses

Si la convention inclut certaines activités, elles sont gratuites pour les membres :

```json
{
  "reservationId": "RES-CONV-ACT-INCL-001",
  "nomClient": "Fatima Zahra",
  "email": "fatima.zahra@societe-test.dz",
  "telephone": "+213 555 999 000",
  "adresse": "456 Rue de la Paix, Oran",
  "dateEntree": "2025-09-01",
  "dateSortie": "2025-09-03",
  "nombrePersonnes": 2,
  "chambreId": "room-uuid-from-convention",
  "numeroChambre": 101,
  "typeChambre": "STANDARD",
  "montantTotal": 0,
  "conventionId": "convention-uuid",
  "receptionnisteId": "REC001",
  "receptionniste": "Admin",
  "activites": [
    {
      "id": 1,
      "nomActivite": "Piscine",
      "prix": 1500
    },
    {
      "id": 2,
      "nomActivite": "Spa & Massage",
      "prix": 5000
    }
  ]
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "reservationId": "RES-CONV-ACT-INCL-001",
    "nomClient": "Fatima Zahra",
    "montantTotal": 5000, // Seulement le prix de l'activité non incluse
    "conventionId": "convention-uuid",
    "activites": [
      {
        "id": 1,
        "nomActivite": "Piscine",
        "prix": 1500,
        "description": "Accès à la piscine avec serviettes incluses",
        "incluse": true // Gratuite car incluse dans la convention
      },
      {
        "id": 2,
        "nomActivite": "Spa & Massage",
        "prix": 5000,
        "description": "Séance de spa et massage relaxant",
        "incluse": false // Payante car non incluse dans la convention
      }
    ]
  }
}
```

### Calcul de prix pour conventionné

**Exemple de calcul pour un conventionné :**
```json
{
  "checkInDate": "2025-09-01",
  "checkOutDate": "2025-09-03",
  "roomId": "room-uuid-from-convention",
  "numberOfAdults": 2,
  "conventionId": "convention-uuid",
  "activites": [
    {
      "id": 1,
      "nomActivite": "Piscine",
      "prix": 1500
    },
    {
      "id": 2,
      "nomActivite": "Spa & Massage",
      "prix": 5000
    }
  ]
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "totalPrice": 5000, // Seulement le prix des activités non incluses
    "priceDetails": {
      "basePrice": 10000,
      "extraPersonPrice": 2000,
      "nights": 2,
      "capacity": 2,
      "extraAdults": 0,
      "basePriceTotal": 20000,
      "extraPrice": 0,
      "roomPrice": 0, // Gratuit pour conventionné
      "prixActivites": 5000, // Seulement l'activité non incluse
      "activites": [
        {
          "id": 1,
          "nomActivite": "Piscine",
          "prix": 1500,
          "description": "Accès à la piscine avec serviettes incluses",
          "incluse": true // Gratuite car incluse dans la convention
        },
        {
          "id": 2,
          "nomActivite": "Spa & Massage",
          "prix": 5000,
          "description": "Séance de spa et massage relaxant",
          "incluse": false // Payante car non incluse
        }
      ],
      "isConventionMember": true,
      "conventionInfo": {
        "numeroConvention": "CONV-2025-001",
        "nomSociete": "Entreprise ABC",
        "dateDebut": "2025-09-01",
        "dateFin": "2025-09-07"
      }
    }
  }
}
```

### Recherche de chambres disponibles

```bash
GET /api/reservations/available-rooms?dateEntree=2025-10-01&dateSortie=2025-10-03&conventionId=convention-uuid
```

**Paramètres :**
- `dateEntree` : Date d'arrivée (YYYY-MM-DD)
- `dateSortie` : Date de départ (YYYY-MM-DD)
- `conventionId` : ID de la convention (optionnel)

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "number": "101",
      "type": "STANDARD",
      "basePrice": 10000,
      "extraPersonPrice": 2000,
      "capacity": 2,
      "isAvailable": true
    }
  ]
}
```

### Récupération des activités disponibles

```bash
GET /api/reservations/available-activities
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nomActivite": "Piscine",
      "prix": 1500,
      "description": "Accès à la piscine avec serviettes incluses"
    },
    {
      "id": 2,
      "nomActivite": "Spa & Massage",
      "prix": 5000,
      "description": "Séance de spa et massage relaxant"
    },
    {
      "id": 3,
      "nomActivite": "Restaurant Gastronomique",
      "prix": 3000,
      "description": "Menu gastronomique avec vue panoramique"
    }
  ]
}
```

### Fonctionnalités des réservations

- **Deux types de clients** : Particuliers (paiement normal) et Conventionnés (chambre gratuite)
- **Gestion des activités** : Ajout d'activités avec calcul automatique du prix total
- **Activités incluses** : Pour les conventionnés, certaines activités peuvent être gratuites
- **Validation des dates** : Vérification que les dates sont dans la période de convention
- **Validation des chambres** : Vérification que la chambre appartient à la convention
- **Calcul de prix intelligent** : Distinction entre prix de chambre et prix d'activités
- **Statuts de réservation** : en_attente, validee, en_cours, annulee

### Routes disponibles

| Méthode | Route | Description | Rôle requis |
|---------|-------|-------------|-------------|
| POST | `/api/reservations` | Créer une réservation | RECEPTIONIST |
| GET | `/api/reservations` | Lister les réservations | RECEPTIONIST |
| GET | `/api/reservations/:id` | Détails d'une réservation | RECEPTIONIST |
| PATCH | `/api/reservations/:id/status` | Modifier le statut | RECEPTIONIST |
| POST | `/api/reservations/:id/payments` | Ajouter un paiement | RECEPTIONIST |
| POST | `/api/reservations/calculate-price` | Calculer le prix | RECEPTIONIST |
| GET | `/api/reservations/available-rooms` | Chambres disponibles | RECEPTIONIST |
| GET | `/api/reservations/available-activities` | Activités disponibles | RECEPTIONIST |
| GET | `/api/reservations/convention/:id/reservations` | Réservations d'une convention | RECEPTIONIST |

## 🎯 Système d'Activités

### Création d'une activité

```bash
POST /api/activities
```

**Corps de la requête :**
```json
{
  "nomActivite": "Piscine",
  "prix": 1500,
  "description": "Accès à la piscine avec serviettes incluses"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Activité créée avec succès",
  "data": {
    "id": "uuid",
    "nomActivite": "Piscine",
    "prix": 1500,
    "description": "Accès à la piscine avec serviettes incluses",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Fonctionnalités des activités

- **CRUD complet** : Création, lecture, modification, suppression
- **Gestion des statuts** : Activation/désactivation des activités
- **Validation des données** : Prix positif, nom unique
- **Recherche** : Recherche par nom d'activité
- **Pagination** : Liste paginée des activités

### Routes disponibles

| Méthode | Route | Description | Rôle requis |
|---------|-------|-------------|-------------|
| POST | `/api/activities` | Créer une activité | MANAGER |
| GET | `/api/activities` | Lister toutes les activités | MANAGER, RECEPTIONIST |
| GET | `/api/activities/:id` | Détails d'une activité | MANAGER, RECEPTIONIST |
| PUT | `/api/activities/:id` | Modifier une activité | MANAGER |
| DELETE | `/api/activities/:id` | Supprimer une activité | MANAGER |
| PATCH | `/api/activities/:id/toggle-status` | Activer/Désactiver | MANAGER |
| GET | `/api/activities/search` | Rechercher par nom | MANAGER, RECEPTIONIST |
| GET | `/api/activities/active/list` | Activités actives | MANAGER, RECEPTIONIST |

### Exemples d'utilisation des activités

#### Créer une activité
```bash
curl -X POST http://localhost:3001/api/activities \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nomActivite": "Spa & Massage",
    "prix": 5000,
    "description": "Séance de spa et massage relaxant"
  }'
```

#### Lister les activités
```bash
curl -X GET http://localhost:3001/api/activities \
  -H "Authorization: Bearer $TOKEN"
```

#### Modifier une activité
```bash
curl -X PUT http://localhost:3001/api/activities/$ACTIVITY_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prix": 6000,
    "description": "Séance de spa et massage relaxant avec huiles essentielles"
  }'
```

#### Activer/Désactiver une activité
```bash
curl -X PATCH http://localhost:3001/api/activities/$ACTIVITY_ID/toggle-status \
  -H "Authorization: Bearer $TOKEN"
```

#### Rechercher des activités
```bash
curl -X GET "http://localhost:3001/api/activities/search?search=Spa" \
  -H "Authorization: Bearer $TOKEN"
```

### Activités par défaut

Le système inclut les activités suivantes par défaut :

- **Piscine** : 1500 DA - Accès à la piscine avec serviettes incluses
- **Spa & Massage** : 5000 DA - Séance de spa et massage relaxant
- **Restaurant Gastronomique** : 3000 DA - Menu gastronomique avec vue panoramique
- **Salle de Sport** : 800 DA - Accès à la salle de sport équipée
- **Excursion Guidée** : 2500 DA - Visite guidée des sites touristiques

## 💡 Exemples d'utilisation

### Workflow complet : Convention + Réservations

1. **Créer une convention**
```bash
curl -X POST http://localhost:3001/api/conventions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "numeroConvention": "CONV-2025-001",
    "nomSociete": "TechCorp",
    "telephone": "+213 555 123 456",
    "email": "contact@techcorp.dz",
    "dateDebut": "2025-09-01",
    "nombreJours": 5,
    "prixConvention": 0,
    "chambresStandard": 3,
    "chambresVIP": 1,
    "chambresSuite": 0,
    "nombreAdultesMaxParChambre": 2,
    "conditionsSpeciales": "Réservations gratuites pour les employés",
    "description": "Convention annuelle de l'entreprise",
    "activitesIncluses": [1, 2] // Piscine et Spa inclus gratuitement
  }'
```

2. **Récupérer les chambres de la convention**
```bash
curl -X GET http://localhost:3001/api/conventions/$CONVENTION_ID \
  -H "Authorization: Bearer $TOKEN"
```

3. **Calculer le prix pour un conventionné**
```bash
curl -X POST http://localhost:3001/api/reservations/calculate-price \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "$ROOM_ID_FROM_CONVENTION",
    "numberOfAdults": 2,
    "checkInDate": "2025-09-01",
    "checkOutDate": "2025-09-03",
    "conventionId": "$CONVENTION_ID",
    "activites": [
      {
        "id": 1,
        "nomActivite": "Piscine",
        "prix": 1500
      },
      {
        "id": 2,
        "nomActivite": "Spa & Massage",
        "prix": 5000
      },
      {
        "id": 3,
        "nomActivite": "Restaurant Gastronomique",
        "prix": 3000
      }
    ]
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "totalPrice": 3000, // Seulement le restaurant (Piscine et Spa sont inclus)
    "priceDetails": {
      "roomPrice": 0, // Chambre gratuite pour conventionné
      "prixActivites": 3000, // Seulement l'activité non incluse
      "activites": [
        {
          "id": 1,
          "nomActivite": "Piscine",
          "prix": 1500,
          "incluse": true // Gratuite
        },
        {
          "id": 2,
          "nomActivite": "Spa & Massage",
          "prix": 5000,
          "incluse": true // Gratuite
        },
        {
          "id": 3,
          "nomActivite": "Restaurant Gastronomique",
          "prix": 3000,
          "incluse": false // Payante
        }
      ],
      "isConventionMember": true
    }
  }
}
```

4. **Créer une réservation conventionnée**
```bash
curl -X POST http://localhost:3001/api/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "RES-CONV-001",
    "nomClient": "John Doe",
    "email": "john@techcorp.com",
    "telephone": "+213 555 111 222",
    "adresse": "123 Tech Street, Alger",
    "dateEntree": "2025-09-01",
    "dateSortie": "2025-09-03",
    "nombrePersonnes": 2,
    "chambreId": "$ROOM_ID_FROM_CONVENTION",
    "numeroChambre": 101,
    "typeChambre": "STANDARD",
    "montantTotal": 3000,
    "conventionId": "$CONVENTION_ID",
    "receptionnisteId": "REC001",
    "receptionniste": "Admin",
    "activites": [
      {
        "id": 1,
        "nomActivite": "Piscine",
        "prix": 1500
      },
      {
        "id": 2,
        "nomActivite": "Spa & Massage",
        "prix": 5000
      },
      {
        "id": 3,
        "nomActivite": "Restaurant Gastronomique",
        "prix": 3000
      }
    ]
  }'
```

### Exemple de réservation pour particulier avec activités

```bash
curl -X POST http://localhost:3001/api/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "RES-PART-001",
    "nomClient": "Marie Martin",
    "email": "marie.martin@email.com",
    "telephone": "+213 555 333 444",
    "adresse": "456 Rue de la Paix, Oran",
    "dateEntree": "2025-10-01",
    "dateSortie": "2025-10-03",
    "nombrePersonnes": 2,
    "chambreId": "$ROOM_ID",
    "numeroChambre": 201,
    "typeChambre": "VIP",
    "montantTotal": 40000, // Prix de la chambre VIP
    "receptionnisteId": "REC001",
    "receptionniste": "Admin",
    "paiements": [
      {
        "paiementId": "PAY-001",
        "methodePaiement": "especes",
        "montant": 40000,
        "datePaiement": "2025-09-30T10:00:00.000Z"
      }
    ],
    "activites": [
      {
        "id": 1,
        "nomActivite": "Piscine",
        "prix": 1500
      },
      {
        "id": 2,
        "nomActivite": "Spa & Massage",
        "prix": 5000
      }
    ]
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "reservationId": "RES-PART-001",
    "nomClient": "Marie Martin",
    "montantTotal": 46500, // 40000 + 1500 + 5000
    "activites": [
      {
        "id": 1,
        "nomActivite": "Piscine",
        "prix": 1500,
        "description": "Accès à la piscine avec serviettes incluses",
        "incluse": false
      },
      {
        "id": 2,
        "nomActivite": "Spa & Massage",
        "prix": 5000,
        "description": "Séance de spa et massage relaxant",
        "incluse": false
      }
    ]
  }
}
```

### Recherche de chambres disponibles

```bash
# Pour particuliers
curl -X GET "http://localhost:3001/api/reservations/available-rooms?dateEntree=2025-10-01&dateSortie=2025-10-03" \
  -H "Authorization: Bearer $TOKEN"

# Pour conventionnés
curl -X GET "http://localhost:3001/api/reservations/available-rooms?dateEntree=2025-09-01&dateSortie=2025-09-03&conventionId=$CONVENTION_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Récupération des activités disponibles

```bash
curl -X GET http://localhost:3001/api/reservations/available-activities \
  -H "Authorization: Bearer $TOKEN"
```

## 🧪 Tests

### Lancer les tests

```bash
npm test
```

### Tests disponibles

- **Tests d'authentification** : Connexion, gestion des rôles
- **Tests de conventions** : CRUD complet, attribution automatique des chambres
- **Tests de réservations** : Particuliers et conventionnés
- **Tests de calcul de prix** : Tarification normale et gratuite
- **Tests de validation** : Dates, disponibilité, permissions

### Exemple de test

```bash
# Tous les tests
npm test

# Tests spécifiques
npm test -- --testNamePattern="Conventions"
npm test -- --testNamePattern="Réservations"
```

## 🔧 Dépannage

### Problèmes courants

1. **Erreur JWT_SECRET**
   - Vérifier que le fichier `.env` existe avec `JWT_SECRET=votre_secret`

2. **Chambres non attribuées à la convention**
   - Vérifier que les chambres sont disponibles pour la période
   - Vérifier que les types de chambres correspondent

3. **Erreur 400 sur réservation conventionnée**
   - Vérifier que la chambre appartient bien à la convention
   - Vérifier que les dates sont dans la période de la convention

4. **Port déjà utilisé**
   ```bash
   taskkill /f /im node.exe
   node src/index.js
   ```

### Logs de debug

Le système inclut des logs de debug pour l'attribution automatique des chambres. Vérifiez la console pour les détails.

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs de la console
2. Consultez la documentation des tests
3. Vérifiez la configuration de la base de données

---

**Version :** 1.0.0  
**Dernière mise à jour :** 2025
