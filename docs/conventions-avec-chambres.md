# Conventions avec Gestion Automatique des Chambres

## Vue d'ensemble

Le système de conventions a été amélioré pour inclure une gestion automatique et détaillée des chambres. Lors de la création d'une convention, le système sélectionne automatiquement les chambres disponibles selon la configuration demandée et retourne toutes les informations détaillées.

## Fonctionnalités Principales

### 1. Création de Convention avec Sélection Automatique des Chambres

Lors de la création d'une convention, l'utilisateur spécifie :
- Le nombre de chambres par type (STANDARD, VIP, SUITE)
- La période de la convention
- Les activités incluses

Le système :
1. Vérifie la disponibilité des chambres pour la période
2. Sélectionne automatiquement les chambres selon la configuration
3. Associe les chambres à la convention
4. Retourne les détails complets incluant les chambres sélectionnées

### 2. Récupération des Conventions avec Chambres

Toutes les méthodes de récupération des conventions incluent maintenant les informations des chambres associées :
- Liste des chambres avec leurs détails
- Statut des chambres
- Informations de prix et capacité

### 3. Détails Complets d'une Convention

Une nouvelle route `/api/conventions/:id/details` fournit :
- Toutes les informations de la convention
- Liste complète des chambres
- Statistiques des chambres par type
- Statut des chambres (actives, réservées, etc.)

## API Endpoints

### Créer une Convention

**POST** `/api/conventions`

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
  "activitesIncluses": [1, 2, 3]
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
        ]
      },
      "VIP": {
        "needed": 2,
        "selected": 2,
        "rooms": []
      },
      "SUITE": {
        "needed": 1,
        "selected": 1,
        "rooms": []
      },
      "totalSelected": 8,
      "totalNeeded": 8
    }
  }
}
```

### Obtenir Toutes les Conventions

**GET** `/api/conventions`

**Paramètres de requête :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 10)
- `search` : Recherche par numéro, société ou contact
- `statut` : Filtrer par statut (ACTIVE, INACTIVE, EXPIRED)
- `dateDebut` et `dateFin` : Filtrer par période

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

### Obtenir les Détails Complets d'une Convention

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

## Logique de Sélection des Chambres

### Algorithme de Sélection

1. **Récupération des chambres disponibles** :
   - Toutes les chambres actives par type
   - Exclusion des chambres déjà réservées pour la période
   - Exclusion des chambres utilisées par d'autres conventions

2. **Sélection par type** :
   - STANDARD : Chambres de base
   - VIP : Chambres de luxe
   - SUITE : Chambres de luxe avec espace supplémentaire

3. **Vérification de disponibilité** :
   - Conflits avec les réservations existantes
   - Conflits avec les autres conventions
   - Période de chevauchement

### Gestion des Erreurs

Si les chambres demandées ne sont pas disponibles :
- Erreur détaillée indiquant les chambres manquantes
- Suppression automatique de la convention créée
- Message d'erreur explicite pour l'utilisateur

## Structure des Données

### Convention
```javascript
{
  id: "uuid",
  numeroConvention: "CONV-2025-001",
  nomSociete: "Entreprise ABC",
  dateDebut: "2025-09-01",
  dateFin: "2025-09-07",
  chambresStandard: 5,
  chambresVIP: 2,
  chambresSuite: 1,
  statut: "ACTIVE",
  rooms: [...], // Chambres associées
  roomSelectionDetails: {...} // Détails de sélection
}
```

### Chambre
```javascript
{
  id: 1,
  number: "101",
  type: "STANDARD",
  basePrice: 5000,
  extraPersonPrice: 1000,
  capacity: 2,
  isActive: true,
  status: "DISPONIBLE"
}
```

### Statistiques des Chambres
```javascript
{
  total: 8,
  byType: {
    STANDARD: 5,
    VIP: 2,
    SUITE: 1
  },
  active: 8,
  reserved: 0
}
```

## Utilisation dans les Réservations

Les conventions avec chambres sont utilisées dans le système de réservations :

1. **Réservations conventionnées** :
   - Utilisent uniquement les chambres de la convention
   - Période limitée à la durée de la convention
   - Prix gratuit (0 DA)

2. **Réservations particulières** :
   - Excluent les chambres des conventions actives
   - Prix normal selon le type de chambre

## Tests

Un fichier de test `test.js` est fourni pour tester toutes les fonctionnalités :

```javascript
const { runTests } = require('./test');

// Exécuter tous les tests
runTests();
```

## Permissions

- **MANAGER** : Création, modification, suppression des conventions
- **RECEPTIONIST** : Consultation des conventions et création de réservations
- **MANAGER + RECEPTIONIST** : Accès en lecture à toutes les fonctionnalités 