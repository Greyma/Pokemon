# Système de Conventions et Réservations

## Vue d'ensemble

Le système de gestion hôtelière supporte deux types de clients :
1. **Particuliers** : Clients normaux qui paient le tarif standard
2. **Conventionnés** : Membres d'entreprises ayant une convention avec l'hôtel

## Architecture des Conventions

### Modèle Convention

Une convention définit :
- **Informations de l'entreprise** : nom, contact, adresse
- **Période de validité** : date de début et fin
- **Configuration des chambres** : nombre de chambres par type (Standard, VIP, Suite)
- **Conditions spéciales** : prix, nombre maximum d'adultes par chambre
- **Statut** : ACTIVE, INACTIVE, EXPIRED

### Sélection automatique des chambres

Lors de la création d'une convention :
1. Le système calcule automatiquement la date de fin basée sur le nombre de jours
2. Il sélectionne automatiquement les chambres disponibles selon la configuration
3. Il vérifie les conflits avec les réservations existantes et autres conventions
4. Il associe les chambres sélectionnées à la convention

## Système de Réservations

### Types de Réservations

#### 1. Réservations Particulières
- **Paiement** : Tarif normal selon le type de chambre
- **Validation** : Nécessite un paiement complet ou un acompte
- **Chambres** : Toutes les chambres disponibles (hors conventions actives)
- **Statut** : `en_cours`, `validee`, `terminee`, `annulee`

#### 2. Réservations Conventionnées
- **Paiement** : Gratuit (prix forcé à 0)
- **Validation** : Automatique (statut `validee`)
- **Chambres** : Uniquement les chambres associées à la convention
- **Période** : Uniquement pendant la durée de la convention
- **Statut** : `validee` (automatique)

### Logique de Disponibilité

#### Pour les Particuliers
```javascript
// Chambres disponibles = Toutes les chambres actives
// - Chambres réservées (réservations normales)
// - Chambres occupées par des conventions actives
```

#### Pour les Conventionnés
```javascript
// Chambres disponibles = Chambres de la convention
// - Chambres réservées (réservations normales)
// - Vérification de la période de convention
```

### Calcul de Prix

#### Particuliers
```javascript
prixTotal = (prixBase * nombreNuits) + (prixPersonneSupp * nombrePersonnesSupp * nombreNuits)
```

#### Conventionnés
```javascript
prixTotal = 0 // Gratuit
```

## API Endpoints

### Conventions

#### CRUD Conventions
- `GET /api/conventions` - Liste des conventions (Manager, Réceptionniste)
- `GET /api/conventions/:id` - Détails d'une convention
- `POST /api/conventions` - Créer une convention (Manager uniquement)
- `PUT /api/conventions/:id` - Modifier une convention (Manager uniquement)
- `DELETE /api/conventions/:id` - Supprimer une convention (Manager uniquement)

#### Recherche et Statistiques
- `GET /api/conventions/search` - Rechercher par société
- `GET /api/conventions/active` - Conventions actives
- `GET /api/conventions/stats` - Statistiques des conventions

### Réservations

#### Gestion des Réservations
- `GET /api/reservations` - Liste des réservations
- `GET /api/reservations/:id` - Détails d'une réservation
- `POST /api/reservations` - Créer une réservation (Réceptionniste, Manager)
- `PATCH /api/reservations/:id/status` - Modifier le statut

#### Recherche de Disponibilité
- `GET /api/reservations/rooms` - Chambres disponibles
  - Paramètres : `dateEntree`, `dateSortie`, `conventionId` (optionnel)

#### Calcul de Prix
- `POST /api/reservations/calculate-price` - Calculer le prix
  - Paramètres : `roomId`, `checkInDate`, `checkOutDate`, `numberOfAdults`, `conventionId` (optionnel)

#### Réservations par Convention
- `GET /api/reservations/convention/:conventionId/reservations` - Réservations d'une convention

## Exemples d'Utilisation

### Créer une Convention

```javascript
const convention = {
  numeroConvention: "CONV-2025-001",
  nomSociete: "Entreprise Test SARL",
  telephone: "+213 555 123 456",
  email: "contact@entreprise-test.dz",
  dateDebut: "2025-07-01",
  nombreJours: 5,
  prixConvention: 15000,
  chambresStandard: 3,
  chambresVIP: 1,
  chambresSuite: 0,
  nombreAdultesMaxParChambre: 2,
  conditionsSpeciales: "Paiement à 30 jours"
};
```

### Réservation Particulière

```javascript
const reservation = {
  reservationId: "RES-PART-001",
  nomClient: "Mohammed Ali",
  email: "mohammed.ali@email.com",
  telephone: "+213 555 111 222",
  dateEntree: "2025-10-01",
  dateSortie: "2025-10-03",
  nombrePersonnes: 2,
  chambreId: 123,
  montantTotal: 20000,
  paiements: [
    {
      paiementId: "PAY-001",
      methodePaiement: "especes",
      montant: 20000
    }
  ]
};
```

### Réservation Conventionnée

```javascript
const reservation = {
  reservationId: "RES-CONV-001",
  nomClient: "Ahmed Benali",
  email: "ahmed.benali@societe-test.dz",
  telephone: "+213 555 333 444",
  dateEntree: "2025-09-01",
  dateSortie: "2025-09-03",
  nombrePersonnes: 2,
  chambreId: 456,
  montantTotal: 0, // Gratuit
  conventionId: "uuid-convention",
  paiements: [] // Pas de paiement
};
```

## Validation et Contrôles

### Validation des Conventions
- Numéro de convention unique
- Dates cohérentes (fin > début)
- Au moins une chambre configurée
- Nombre d'adultes entre 1 et 4
- Prix non négatif

### Validation des Réservations Conventionnées
- Convention existe et est active
- Chambre appartient à la convention
- Dates dans la période de convention
- Nombre d'adultes respecte la limite de la convention

### Validation des Réservations Particulières
- Chambre disponible pour les dates
- Chambre non occupée par une convention active
- Paiement suffisant pour validation

## Gestion des Erreurs

### Erreurs Courantes

1. **Convention non trouvée**
   - Code : 404
   - Message : "Convention non trouvée"

2. **Chambre non disponible**
   - Code : 400
   - Message : "Chambre non disponible pour les dates spécifiées"

3. **Période de convention invalide**
   - Code : 400
   - Message : "Les dates de réservation doivent être dans la période de la convention"

4. **Chambre non associée à la convention**
   - Code : 400
   - Message : "Cette chambre n'appartient pas à la convention spécifiée"

5. **Permissions insuffisantes**
   - Code : 403
   - Message : "Accès refusé"

## Tests

Le système inclut des tests complets pour :
- CRUD des conventions
- Réservations particulières et conventionnées
- Calcul de prix
- Recherche de disponibilité
- Validation des données
- Gestion des erreurs

### Exécution des Tests

```bash
npm test
```

## Sécurité

### Authentification
- Toutes les routes nécessitent un token JWT valide
- Gestion des rôles (Manager, Réceptionniste)

### Autorisation
- **Manager** : Accès complet (CRUD conventions, toutes les réservations)
- **Réceptionniste** : Lecture des conventions, gestion des réservations

### Validation des Données
- Validation côté serveur de toutes les entrées
- Sanitisation des données
- Protection contre les injections SQL (Sequelize)

## Performance

### Optimisations
- Index sur les champs fréquemment utilisés
- Requêtes optimisées avec Sequelize
- Pagination pour les listes
- Cache des requêtes fréquentes

### Monitoring
- Logs détaillés des opérations
- Métriques de performance
- Alertes en cas d'erreur 