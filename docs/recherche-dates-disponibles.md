# Recherche de Dates Disponibles

## Vue d'ensemble

Cette fonctionnalité permet de rechercher toutes les dates disponibles pour une période donnée avec un nombre spécifique de chambres par type. Elle est particulièrement utile pour planifier des conventions ou des événements en trouvant les meilleures périodes disponibles.

## Fonctionnalités

### 1. Recherche intelligente
- Recherche de toutes les dates disponibles dans une période donnée
- Vérification de la disponibilité par type de chambre
- Tri automatique par ordre chronologique croissant
- Gestion des conflits de réservation

### 2. Configuration flexible
- Nombre de jours personnalisable (1 à 365 jours)
- Configuration par type de chambre (STANDARD, VIP, SUITE)
- Période de recherche personnalisable
- Limite de recherche automatique (1 an par défaut)

### 3. Résultats détaillés
- Liste complète des dates disponibles
- Détails de disponibilité par type de chambre
- Informations sur la période de recherche
- Statistiques des résultats

## API Endpoint

### Rechercher les dates disponibles
**POST** `/api/conventions/rechercher-dates-disponibles`

**Permissions** : MANAGER uniquement

**Description** : Recherche toutes les dates disponibles pour une période donnée

**Corps de la requête** :
```json
{
  "dateDebut": "2024-01-01",
  "nombreJours": 7,
  "chambresStandard": 5,
  "chambresVIP": 2,
  "chambresSuite": 1,
  "dateFinMax": "2024-12-31"
}
```

**Paramètres** :
- `dateDebut` (requis) : Date de début de la recherche (format YYYY-MM-DD)
- `nombreJours` (requis) : Nombre de jours pour chaque période (1-365)
- `chambresStandard` (optionnel) : Nombre de chambres standard (0-50)
- `chambresVIP` (optionnel) : Nombre de chambres VIP (0-20)
- `chambresSuite` (optionnel) : Nombre de chambres suite (0-10)
- `dateFinMax` (optionnel) : Date de fin maximale de recherche (format YYYY-MM-DD)

**Réponse** :
```json
{
  "success": true,
  "message": "15 périodes disponibles trouvées",
  "data": {
    "configuration": {
      "STANDARD": 5,
      "VIP": 2,
      "SUITE": 1,
      "total": 8
    },
    "periodeRecherche": {
      "dateDebut": "2024-01-01",
      "dateFinMax": "2024-12-31",
      "nombreJours": 7
    },
    "datesDisponibles": [
      {
        "dateDebut": "2024-01-15",
        "dateFin": "2024-01-22",
        "nombreJours": 7,
        "disponibilite": {
          "STANDARD": {
            "necessaire": 5,
            "disponible": 8
          },
          "VIP": {
            "necessaire": 2,
            "disponible": 3
          },
          "SUITE": {
            "necessaire": 1,
            "disponible": 2
          }
        }
      },
      {
        "dateDebut": "2024-02-01",
        "dateFin": "2024-02-08",
        "nombreJours": 7,
        "disponibilite": {
          "STANDARD": {
            "necessaire": 5,
            "disponible": 10
          },
          "VIP": {
            "necessaire": 2,
            "disponible": 4
          },
          "SUITE": {
            "necessaire": 1,
            "disponible": 2
          }
        }
      }
    ],
    "total": 15
  }
}
```

## Exemples d'utilisation

### 1. Recherche simple pour une semaine
```bash
POST /api/conventions/rechercher-dates-disponibles
{
  "dateDebut": "2024-06-01",
  "nombreJours": 7,
  "chambresStandard": 3,
  "chambresVIP": 1
}
```

### 2. Recherche pour un mois complet
```bash
POST /api/conventions/rechercher-dates-disponibles
{
  "dateDebut": "2024-07-01",
  "nombreJours": 30,
  "chambresStandard": 10,
  "chambresVIP": 3,
  "chambresSuite": 1,
  "dateFinMax": "2024-08-31"
}
```

### 3. Recherche pour un événement court
```bash
POST /api/conventions/rechercher-dates-disponibles
{
  "dateDebut": "2024-09-01",
  "nombreJours": 3,
  "chambresStandard": 5,
  "chambresVIP": 2
}
```

## Algorithme de recherche

### 1. Vérification préliminaire
- Vérification de la disponibilité globale des chambres par type
- Validation des paramètres de recherche
- Initialisation du calendrier d'occupation

### 2. Analyse des réservations existantes
- Récupération de toutes les réservations dans la période
- Création d'un calendrier d'occupation par chambre
- Identification des périodes de conflit

### 3. Recherche des disponibilités
- Parcours de chaque date possible dans la période
- Vérification de la disponibilité pour chaque type de chambre
- Calcul des chambres disponibles par période

### 4. Filtrage et tri
- Filtrage des périodes avec suffisamment de chambres
- Tri par ordre chronologique croissant
- Formatage des résultats

## Cas d'usage

### 1. Planification d'événements
- Trouver les meilleures dates pour un événement d'entreprise
- Vérifier la disponibilité pour des conférences
- Planifier des séminaires ou formations

### 2. Gestion des conventions
- Identifier les périodes optimales pour les conventions
- Éviter les conflits avec d'autres événements
- Optimiser l'occupation des chambres

### 3. Analyse de marché
- Comprendre les périodes de forte demande
- Identifier les créneaux disponibles
- Planifier les promotions

## Règles métier

### Validation des données
- Au moins une chambre doit être configurée
- Le nombre de jours doit être entre 1 et 365
- Les dates doivent être au format ISO 8601
- La date de fin maximale doit être postérieure à la date de début

### Logique de disponibilité
- Seules les chambres libres sont considérées
- Vérification des conflits de réservation
- Prise en compte des réservations annulées
- Calcul par type de chambre

### Performance
- Recherche optimisée avec indexation
- Limitation de la période de recherche (1 an par défaut)
- Pagination des résultats si nécessaire
- Cache des résultats fréquents

## Gestion des erreurs

### Erreurs de validation
```json
{
  "success": false,
  "message": "Données invalides",
  "details": [
    {
      "field": "nombreJours",
      "message": "Le nombre de jours doit être entre 1 et 365",
      "value": 400
    }
  ]
}
```

### Erreurs de disponibilité
```json
{
  "success": false,
  "message": "Chambres insuffisantes disponibles",
  "details": {
    "STANDARD": {
      "necessaire": 10,
      "disponible": 5
    },
    "VIP": {
      "necessaire": 3,
      "disponible": 2
    },
    "SUITE": {
      "necessaire": 1,
      "disponible": 0
    }
  }
}
```

## Intégration avec le système

### Workflow complet
1. **Recherche des dates disponibles** pour identifier les périodes optimales
2. **Vérification de disponibilité** pour une période spécifique
3. **Création de la convention** avec les paramètres choisis
4. **Création des réservations automatiques** pour la période sélectionnée

### Exemple de workflow
```javascript
// 1. Rechercher les dates disponibles
const datesDisponibles = await fetch('/api/conventions/rechercher-dates-disponibles', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({
    dateDebut: '2024-06-01',
    nombreJours: 7,
    chambresStandard: 5,
    chambresVIP: 2
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
    chambresStandard: 5,
    chambresVIP: 2,
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

1. **Efficacité** : Recherche rapide de toutes les disponibilités
2. **Flexibilité** : Configuration personnalisable par type de chambre
3. **Précision** : Résultats détaillés avec disponibilité par type
4. **Intégration** : Workflow complet avec le système de conventions
5. **Performance** : Algorithme optimisé pour de grandes périodes
6. **Fiabilité** : Gestion complète des conflits de réservation 