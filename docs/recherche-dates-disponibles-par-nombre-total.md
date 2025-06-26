# Recherche de Dates Disponibles par Nombre Total de Chambres

## Vue d'ensemble

Cette fonctionnalité permet de rechercher toutes les périodes de jours consécutifs dans une plage de dates donnée où un nombre spécifique de chambres est disponible simultanément. Elle est idéale pour planifier des événements ou conventions qui nécessitent un nombre total de chambres sans se soucier du type spécifique.

## Fonctionnalités

### 1. Recherche flexible par nombre total
- Spécification d'une période de recherche (dateDebut à dateFin)
- Recherche de périodes consécutives de X jours
- Vérification du nombre total de chambres disponibles
- Indépendant du type de chambre

### 2. Configuration simple
- `dateDebut` : Date de début de la période de recherche
- `dateFin` : Date de fin de la période de recherche
- `nombreJours` : Nombre de jours consécutifs requis
- `nombreChambresTotal` : Nombre total de chambres nécessaires

### 3. Résultats détaillés
- Liste de toutes les périodes disponibles
- Nombre de chambres disponibles pour chaque période
- Répartition par type de chambre (informative)
- Tri chronologique

## API Endpoint

### Rechercher les dates disponibles par nombre total
**POST** `/api/conventions/rechercher-dates-disponibles-par-nombre-total`

**Permissions** : MANAGER uniquement

**Description** : Recherche toutes les périodes de jours consécutifs avec un nombre total de chambres disponible

**Corps de la requête** :
```json
{
  "dateDebut": "2024-06-01",
  "dateFin": "2024-08-07",
  "nombreJours": 7,
  "nombreChambresTotal": 20
}
```

**Paramètres** :
- `dateDebut` (requis) : Date de début de la période de recherche (format YYYY-MM-DD)
- `dateFin` (requis) : Date de fin de la période de recherche (format YYYY-MM-DD)
- `nombreJours` (requis) : Nombre de jours consécutifs requis (1-365)
- `nombreChambresTotal` (requis) : Nombre total de chambres nécessaires (1-100)

**Réponse** :
```json
{
  "success": true,
  "message": "12 périodes disponibles trouvées",
  "data": {
    "configuration": {
      "nombreChambresTotal": 20,
      "nombreJours": 7
    },
    "periodeRecherche": {
      "dateDebut": "2024-06-01",
      "dateFin": "2024-08-07",
      "nombreJours": 7
    },
    "datesDisponibles": [
      {
        "dateDebut": "2024-06-15",
        "dateFin": "2024-06-22",
        "nombreJours": 7,
        "nombreChambresDisponibles": 25,
        "disponibilite": {
          "total": {
            "necessaire": 20,
            "disponible": 25
          },
          "STANDARD": {
            "disponible": 18
          },
          "VIP": {
            "disponible": 5
          },
          "SUITE": {
            "disponible": 2
          }
        }
      },
      {
        "dateDebut": "2024-06-20",
        "dateFin": "2024-06-27",
        "nombreJours": 7,
        "nombreChambresDisponibles": 22,
        "disponibilite": {
          "total": {
            "necessaire": 20,
            "disponible": 22
          },
          "STANDARD": {
            "disponible": 16
          },
          "VIP": {
            "disponible": 4
          },
          "SUITE": {
            "disponible": 2
          }
        }
      }
    ],
    "total": 12
  }
}
```

## Exemples d'utilisation

### 1. Recherche pour un événement d'entreprise
```bash
POST /api/conventions/rechercher-dates-disponibles-par-nombre-total
{
  "dateDebut": "2024-07-01",
  "dateFin": "2024-07-31",
  "nombreJours": 5,
  "nombreChambresTotal": 15
}
```

### 2. Recherche pour une convention longue
```bash
POST /api/conventions/rechercher-dates-disponibles-par-nombre-total
{
  "dateDebut": "2024-09-01",
  "dateFin": "2024-10-31",
  "nombreJours": 14,
  "nombreChambresTotal": 30
}
```

### 3. Recherche pour un événement court
```bash
POST /api/conventions/rechercher-dates-disponibles-par-nombre-total
{
  "dateDebut": "2024-12-01",
  "dateFin": "2024-12-15",
  "nombreJours": 3,
  "nombreChambresTotal": 10
}
```

## Algorithme de recherche

### 1. Vérification préliminaire
- Vérification de la disponibilité globale des chambres
- Validation des paramètres de recherche
- Vérification que le nombre total de chambres est suffisant

### 2. Analyse des réservations existantes
- Récupération de toutes les réservations dans la période
- Création d'un calendrier d'occupation par chambre
- Identification des périodes de conflit

### 3. Recherche des disponibilités
- Parcours de chaque date possible dans la période de recherche
- Vérification de la disponibilité pour chaque période de X jours
- Calcul du nombre total de chambres disponibles

### 4. Filtrage et tri
- Filtrage des périodes avec suffisamment de chambres
- Tri par ordre chronologique croissant
- Formatage des résultats avec détails par type

## Cas d'usage

### 1. Planification d'événements d'entreprise
- Trouver les meilleures dates pour des séminaires
- Planifier des conférences avec un nombre fixe de participants
- Organiser des formations en interne

### 2. Gestion des conventions
- Identifier les périodes optimales pour des conventions
- Planifier des événements avec des besoins en chambres flexibles
- Optimiser l'occupation sans contrainte de type de chambre

### 3. Analyse de capacité
- Comprendre les périodes de forte disponibilité
- Identifier les créneaux pour des événements importants
- Planifier les promotions et offres spéciales

## Règles métier

### Validation des données
- Tous les paramètres sont obligatoires
- Le nombre de jours doit être entre 1 et 365
- Le nombre de chambres total doit être entre 1 et 100
- La date de fin doit être postérieure à la date de début
- Les dates doivent être au format ISO 8601

### Logique de disponibilité
- Seules les chambres libres sont considérées
- Vérification des conflits de réservation
- Prise en compte des réservations annulées
- Calcul du nombre total de chambres disponibles

### Performance
- Recherche optimisée avec indexation
- Limitation de la période de recherche
- Calcul efficace des disponibilités
- Tri automatique des résultats

## Gestion des erreurs

### Erreurs de validation
```json
{
  "success": false,
  "message": "Données invalides",
  "details": [
    {
      "field": "nombreChambresTotal",
      "message": "Le nombre de chambres total doit être entre 1 et 100",
      "value": 150
    },
    {
      "field": "dateFin",
      "message": "La date de fin doit être postérieure à la date de début",
      "value": "2024-05-01"
    }
  ]
}
```

### Erreurs de disponibilité
```json
{
  "success": false,
  "message": "Chambres insuffisantes disponibles. Nécessaire: 50, Disponible: 30",
  "details": {
    "necessaire": 50,
    "disponible": 30
  }
}
```

## Intégration avec le système

### Workflow complet
1. **Recherche des dates disponibles** pour identifier les périodes optimales
2. **Sélection d'une période** parmi les résultats
3. **Création de la convention** avec les paramètres choisis
4. **Création des réservations automatiques** pour la période sélectionnée

### Exemple de workflow
```javascript
// 1. Rechercher les dates disponibles par nombre total
const datesDisponibles = await fetch('/api/conventions/rechercher-dates-disponibles-par-nombre-total', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({
    dateDebut: '2024-06-01',
    dateFin: '2024-08-07',
    nombreJours: 7,
    nombreChambresTotal: 20
  })
});

// 2. Choisir une période
const periodeChoisie = datesDisponibles.data.datesDisponibles[0];

// 3. Créer la convention
const convention = await fetch('/api/conventions', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({
    numeroConvention: 'CONV-2024-001',
    nomSociete: 'Entreprise ABC',
    dateDebut: periodeChoisie.dateDebut,
    dateFin: periodeChoisie.dateFin,
    // Configuration des chambres basée sur la disponibilité
    chambresStandard: Math.min(15, periodeChoisie.disponibilite.STANDARD.disponible),
    chambresVIP: Math.min(3, periodeChoisie.disponibilite.VIP.disponible),
    chambresSuite: Math.min(2, periodeChoisie.disponibilite.SUITE.disponible),
    // ... autres paramètres
  })
});

// 4. Créer les réservations automatiques
const reservations = await fetch(`/api/conventions/${convention.id}/creer-reservations`, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token }
});
```

## Avantages

1. **Simplicité** : Configuration simple avec seulement 4 paramètres
2. **Flexibilité** : Indépendant du type de chambre
3. **Efficacité** : Recherche rapide dans une période définie
4. **Précision** : Résultats détaillés avec nombre exact de chambres
5. **Intégration** : Workflow complet avec le système de conventions
6. **Performance** : Algorithme optimisé pour de grandes périodes
7. **Fiabilité** : Gestion complète des conflits de réservation
8. **Adaptabilité** : Parfait pour les événements avec besoins flexibles 