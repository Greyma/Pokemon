# Système de Réservation Automatique des Conventions

## Vue d'ensemble

Le système de réservation automatique permet de créer automatiquement des réservations de chambres basées sur les conventions d'entreprise. Lorsqu'une convention est créée, le manager peut automatiquement réserver les chambres nécessaires selon la configuration définie.

## Fonctionnalités

### 1. Configuration des chambres par type
Chaque convention peut spécifier le nombre de chambres par type :
- **STANDARD** : 0 à 50 chambres
- **VIP** : 0 à 20 chambres  
- **SUITE** : 0 à 10 chambres

### 2. Réservation automatique
- Création automatique des réservations pour la période de la convention
- Attribution automatique des chambres disponibles par type
- Mise à jour du statut des chambres (LIBRE → RÉSERVÉE)
- Génération d'IDs de réservation uniques

### 3. Gestion des réservations
- Annulation automatique de toutes les réservations d'une convention
- Libération automatique des chambres lors de l'annulation
- Suivi du statut des réservations

## Modèle de données

### Convention (mis à jour)
```javascript
{
  // ... autres champs existants
  chambresStandard: 5,      // Nombre de chambres standard
  chambresVIP: 2,           // Nombre de chambres VIP
  chambresSuite: 0,         // Nombre de chambres suite
  reservationAutomatique: false,  // Si les réservations ont été créées
  reservationsCreees: false       // Statut des réservations
}
```

### Réservation (format automatique)
```javascript
{
  reservationId: "CONV-CONV-2024-001-STANDARD-1",
  nomClient: "Entreprise ABC - Convention",
  email: "convention@hotel.com",
  telephone: "0123456789",
  dateEntree: "2024-01-01",
  dateSortie: "2024-12-31",
  nombrePersonnes: 2,
  chambreId: "uuid-chambre",
  numeroChambre: "101",
  typeChambre: "STANDARD",
  montantTotal: 150.00,
  paiements: [{
    montant: 150.00,
    methode: "CONVENTION",
    date: "2024-01-01T00:00:00.000Z",
    statut: "PAYE"
  }],
  nomGarant: "Entreprise ABC",
  remarques: "Réservation automatique - Convention CONV-2024-001",
  receptionnisteId: "uuid-user",
  receptionniste: "Système automatique",
  statut: "validee"
}
```

## API Endpoints

### 1. Créer des réservations automatiques
**POST** `/api/conventions/:id/creer-reservations`

**Permissions** : MANAGER uniquement

**Description** : Crée automatiquement les réservations pour une convention

**Réponse** :
```json
{
  "success": true,
  "message": "7 réservations créées avec succès",
  "data": {
    "convention": { /* détails de la convention */ },
    "reservations": [ /* liste des réservations créées */ ],
    "configuration": {
      "STANDARD": 5,
      "VIP": 2,
      "SUITE": 0,
      "total": 7
    }
  }
}
```

### 2. Annuler les réservations automatiques
**DELETE** `/api/conventions/:id/annuler-reservations`

**Permissions** : MANAGER uniquement

**Description** : Annule toutes les réservations d'une convention

**Réponse** :
```json
{
  "success": true,
  "message": "7 réservations annulées avec succès",
  "data": {
    "reservationsAnnulees": 7
  }
}
```

### 3. Obtenir le statut des réservations
**GET** `/api/conventions/:id/statut-reservations`

**Permissions** : MANAGER, RECEPTIONIST

**Description** : Récupère le statut des réservations d'une convention

**Réponse** :
```json
{
  "success": true,
  "data": {
    "convention": { /* détails de la convention */ },
    "configuration": {
      "STANDARD": 5,
      "VIP": 2,
      "SUITE": 0,
      "total": 7
    },
    "reservations": {
      "total": 7,
      "parType": {
        "STANDARD": 5,
        "VIP": 2,
        "SUITE": 0
      },
      "details": {
        "STANDARD": [ /* réservations standard */ ],
        "VIP": [ /* réservations VIP */ ],
        "SUITE": [ /* réservations suite */ ]
      }
    },
    "statut": {
      "reservationsCreees": true,
      "reservationAutomatique": true
    }
  }
}
```

### 4. Vérifier la disponibilité
**POST** `/api/conventions/verifier-disponibilite`

**Permissions** : MANAGER uniquement

**Description** : Vérifie la disponibilité des chambres pour une période

**Corps de la requête** :
```json
{
  "dateDebut": "2024-01-01",
  "dateFin": "2024-12-31",
  "chambresStandard": 5,
  "chambresVIP": 2,
  "chambresSuite": 0
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "disponibilite": {
      "suffisantes": true,
      "totalDisponible": 15,
      "chambres": {
        "STANDARD": [ /* chambres disponibles */ ],
        "VIP": [ /* chambres disponibles */ ],
        "SUITE": [ /* chambres disponibles */ ]
      },
      "details": {
        "STANDARD": {
          "necessaire": 5,
          "disponible": 10
        },
        "VIP": {
          "necessaire": 2,
          "disponible": 3
        },
        "SUITE": {
          "necessaire": 0,
          "disponible": 2
        }
      }
    },
    "configuration": {
      "STANDARD": 5,
      "VIP": 2,
      "SUITE": 0,
      "total": 7
    }
  }
}
```

## Workflow d'utilisation

### 1. Création d'une convention
```bash
POST /api/conventions
{
  "numeroConvention": "CONV-2024-001",
  "nomSociete": "Entreprise ABC",
  "telephone": "0123456789",
  "dateDebut": "2024-01-01",
  "dateFin": "2024-12-31",
  "prixConvention": 150.00,
  "chambresStandard": 5,
  "chambresVIP": 2,
  "chambresSuite": 0,
  "nombreAdultesMaxParChambre": 2
}
```

### 2. Vérification de disponibilité (optionnel)
```bash
POST /api/conventions/verifier-disponibilite
{
  "dateDebut": "2024-01-01",
  "dateFin": "2024-12-31",
  "chambresStandard": 5,
  "chambresVIP": 2,
  "chambresSuite": 0
}
```

### 3. Création des réservations automatiques
```bash
POST /api/conventions/{conventionId}/creer-reservations
```

### 4. Vérification du statut
```bash
GET /api/conventions/{conventionId}/statut-reservations
```

### 5. Annulation si nécessaire
```bash
DELETE /api/conventions/{conventionId}/annuler-reservations
```

## Règles métier

### Validation des données
- Au moins une chambre doit être configurée
- Les dates de fin doivent être postérieures aux dates de début
- Les limites par type de chambre doivent être respectées

### Disponibilité des chambres
- Seules les chambres libres sont considérées
- Vérification des conflits de réservation pour la période
- Attribution par ordre de priorité (STANDARD, VIP, SUITE)

### Gestion des erreurs
- Impossible de créer des réservations si elles existent déjà
- Impossible de modifier une convention avec des réservations existantes
- Impossible de supprimer une convention avec des réservations existantes

### Sécurité
- Seuls les managers peuvent créer/annuler des réservations automatiques
- Les réceptionnistes peuvent consulter le statut
- Validation des données à tous les niveaux

## Exemples d'utilisation

### Créer une convention avec réservations automatiques
```javascript
// 1. Créer la convention
const convention = await fetch('/api/conventions', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({
    numeroConvention: 'CONV-2024-002',
    nomSociete: 'Tech Solutions',
    telephone: '0987654321',
    dateDebut: '2024-02-01',
    dateFin: '2024-12-31',
    prixConvention: 180.00,
    chambresStandard: 10,
    chambresVIP: 3,
    chambresSuite: 1,
    nombreAdultesMaxParChambre: 2
  })
});

// 2. Créer les réservations automatiques
const reservations = await fetch(`/api/conventions/${convention.id}/creer-reservations`, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token }
});
```

### Vérifier et annuler des réservations
```javascript
// Vérifier le statut
const statut = await fetch(`/api/conventions/${conventionId}/statut-reservations`, {
  headers: { 'Authorization': 'Bearer ' + token }
});

// Annuler si nécessaire
if (statut.reservationsCreees) {
  await fetch(`/api/conventions/${conventionId}/annuler-reservations`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
  });
}
```

## Avantages du système

1. **Automatisation** : Réduction des erreurs manuelles
2. **Cohérence** : Toutes les réservations suivent le même format
3. **Traçabilité** : Suivi complet des réservations par convention
4. **Flexibilité** : Configuration par type de chambre
5. **Sécurité** : Validation et permissions appropriées
6. **Réversibilité** : Annulation possible des réservations 