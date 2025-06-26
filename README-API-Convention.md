# API Convention - Documentation Complète

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Authentification](#authentification)
3. [Permissions](#permissions)
4. [Endpoints Principaux](#endpoints-principaux)
5. [Gestion des Réservations Automatiques](#gestion-des-réservations-automatiques)
6. [Recherche de Disponibilité](#recherche-de-disponibilité)
7. [Gestion des Fichiers](#gestion-des-fichiers)
8. [Modèle de Données](#modèle-de-données)
9. [Codes d'erreur](#codes-derreur)
10. [Exemples Complets](#exemples-complets)

## Vue d'ensemble

L'API Convention permet de gérer les conventions d'entreprise avec réservation automatique de chambres. Elle offre un CRUD complet, la gestion des réservations automatiques, la recherche de disponibilité et la gestion des justificatifs.

**Base URL** : `http://localhost:3001/api/conventions`

## Authentification

Tous les endpoints nécessitent une authentification JWT. Incluez le token dans le header :

```http
Authorization: Bearer <votre_token_jwt>
```

## Permissions

- **MANAGER** : Accès complet (CRUD, réservations automatiques, upload fichiers)
- **RECEPTIONIST** : Lecture seule (consultation, téléchargement fichiers)

## Endpoints Principaux

### 1. Récupérer toutes les conventions

```http
GET /api/conventions
```

**Permissions** : MANAGER, RECEPTIONIST

**Paramètres de requête** :
- `page` (optionnel) : Numéro de page (défaut: 1)
- `limit` (optionnel) : Nombre d'éléments par page (défaut: 10)
- `search` (optionnel) : Recherche textuelle
- `statut` (optionnel) : ACTIVE, INACTIVE, EXPIRED
- `dateDebut` (optionnel) : Date de début (YYYY-MM-DD)
- `dateFin` (optionnel) : Date de fin (YYYY-MM-DD)

**Exemple de réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-convention",
      "numeroConvention": "CONV-2024-001",
      "nomSociete": "Tech Solutions",
      "telephone": "0123456789",
      "dateDebut": "2024-06-01",
      "dateFin": "2024-06-07",
      "prixConvention": "150.00",
      "chambresStandard": 5,
      "chambresVIP": 2,
      "chambresSuite": 1,
      "nombreAdultesMaxParChambre": 2,
      "description": "Convention annuelle Tech Solutions...",
      "email": "contact@techsolutions.com",
      "adresse": "123 Rue de la Tech, Paris",
      "contactPrincipal": "Jean Dupont",
      "conditionsSpeciales": "Pension complète incluse",
      "statut": "ACTIVE",
      "notes": "Notes importantes",
      "reservationAutomatique": false,
      "reservationsCreees": false,
      "createdBy": "uuid-user",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
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

### 2. Récupérer une convention spécifique

```http
GET /api/conventions/{id}
```

**Permissions** : MANAGER, RECEPTIONIST

**Paramètres** :
- `id` : UUID de la convention

### 3. Créer une nouvelle convention

```http
POST /api/conventions
```

**Permissions** : MANAGER uniquement

**Corps de la requête** :
```json
{
  "numeroConvention": "CONV-2024-001",
  "nomSociete": "Tech Solutions",
  "telephone": "0123456789",
  "dateDebut": "2024-06-01",
  "dateFin": "2024-06-07",
  "prixConvention": 150.00,
  "chambresStandard": 5,
  "chambresVIP": 2,
  "chambresSuite": 1,
  "nombreAdultesMaxParChambre": 2,
  "description": "Convention annuelle Tech Solutions pour la formation des équipes de développement. Cette convention réunit 20 développeurs pour des sessions de formation sur les nouvelles technologies, des ateliers pratiques et des présentations de projets innovants.",
  "email": "contact@techsolutions.com",
  "adresse": "123 Rue de la Tech, Paris",
  "contactPrincipal": "Jean Dupont",
  "conditionsSpeciales": "Pension complète incluse",
  "notes": "Notes importantes"
}
```

**Validation** :
- `numeroConvention` : Requis, unique, max 50 caractères
- `nomSociete` : Requis, max 100 caractères
- `telephone` : Requis, max 20 caractères
- `dateDebut` : Requis, format YYYY-MM-DD
- `dateFin` : Requis, format YYYY-MM-DD, > dateDebut
- `prixConvention` : Requis, >= 0
- `chambresStandard` : Requis, 0-50
- `chambresVIP` : Requis, 0-20
- `chambresSuite` : Requis, 0-10
- `nombreAdultesMaxParChambre` : Requis, 1-4
- `description` : Optionnel, max 2000 caractères
- `email` : Optionnel, format email valide
- `adresse` : Optionnel, max 500 caractères
- `contactPrincipal` : Optionnel, max 100 caractères
- `conditionsSpeciales` : Optionnel, max 1000 caractères
- `notes` : Optionnel, max 1000 caractères

### 4. Modifier une convention

```http
PUT /api/conventions/{id}
```

**Permissions** : MANAGER uniquement

**Corps de la requête** : Même structure que la création (tous les champs optionnels)

### 5. Supprimer une convention

```http
DELETE /api/conventions/{id}
```

**Permissions** : MANAGER uniquement

### 6. Rechercher des conventions par société

```http
GET /api/conventions/search?nomSociete=Tech Solutions
```

**Permissions** : MANAGER, RECEPTIONIST

### 7. Obtenir les conventions actives

```http
GET /api/conventions/active
```

**Permissions** : MANAGER, RECEPTIONIST

### 8. Obtenir les statistiques

```http
GET /api/conventions/stats
```

**Permissions** : MANAGER, RECEPTIONIST

## Gestion des Réservations Automatiques

### 1. Créer des réservations automatiques

```http
POST /api/conventions/{id}/creer-reservations
```

**Permissions** : MANAGER uniquement

**Exemple de réponse** :
```json
{
  "success": true,
  "message": "Réservations automatiques créées avec succès",
  "data": {
    "convention": {
      "id": "uuid-convention",
      "numeroConvention": "CONV-2024-001",
      "reservationAutomatique": true,
      "reservationsCreees": true
    },
    "reservations": [
      {
        "id": "uuid-reservation",
        "numeroChambre": "101",
        "typeChambre": "STANDARD",
        "dateDebut": "2024-06-01",
        "dateFin": "2024-06-07",
        "statut": "CONFIRMEE"
      }
    ],
    "configuration": {
      "STANDARD": 5,
      "VIP": 2,
      "SUITE": 1,
      "total": 8
    }
  }
}
```

### 2. Annuler les réservations automatiques

```http
DELETE /api/conventions/{id}/annuler-reservations
```

**Permissions** : MANAGER uniquement

### 3. Obtenir le statut des réservations

```http
GET /api/conventions/{id}/statut-reservations
```

**Permissions** : MANAGER, RECEPTIONIST

**Exemple de réponse** :
```json
{
  "success": true,
  "data": {
    "convention": {
      "id": "uuid-convention",
      "numeroConvention": "CONV-2024-001",
      "reservationAutomatique": true,
      "reservationsCreees": true
    },
    "statutReservations": {
      "total": 8,
      "confirmees": 8,
      "enAttente": 0,
      "annulees": 0,
      "parType": {
        "STANDARD": 5,
        "VIP": 2,
        "SUITE": 1
      }
    },
    "reservations": [
      {
        "id": "uuid-reservation",
        "numeroChambre": "101",
        "typeChambre": "STANDARD",
        "dateDebut": "2024-06-01",
        "dateFin": "2024-06-07",
        "statut": "CONFIRMEE"
      }
    ]
  }
}
```

## Recherche de Disponibilité

### 1. Vérifier la disponibilité des chambres

```http
POST /api/conventions/verifier-disponibilite
```

**Permissions** : MANAGER uniquement

**Corps de la requête** :
```json
{
  "dateDebut": "2024-06-01",
  "dateFin": "2024-06-07",
  "chambresStandard": 5,
  "chambresVIP": 2,
  "chambresSuite": 1
}
```

**Exemple de réponse** :
```json
{
  "success": true,
  "data": {
    "disponibilite": {
      "disponible": true,
      "chambresDisponibles": {
        "STANDARD": 10,
        "VIP": 5,
        "SUITE": 3
      },
      "chambresDemandees": {
        "STANDARD": 5,
        "VIP": 2,
        "SUITE": 1
      },
      "suffisant": true
    },
    "configuration": {
      "STANDARD": 5,
      "VIP": 2,
      "SUITE": 1,
      "total": 8
    }
  }
}
```

### 2. Rechercher toutes les dates disponibles

```http
POST /api/conventions/rechercher-dates-disponibles
```

**Permissions** : MANAGER uniquement

**Corps de la requête** :
```json
{
  "dateDebut": "2024-06-01",
  "nombreJours": 7,
  "chambresStandard": 5,
  "chambresVIP": 2,
  "chambresSuite": 1,
  "dateFinMax": "2024-12-31"
}
```

**Ou avec dateFin** :
```json
{
  "dateDebut": "2024-06-01",
  "dateFin": "2024-06-07",
  "chambresStandard": 5,
  "chambresVIP": 2,
  "chambresSuite": 1,
  "dateFinMax": "2024-12-31"
}
```

**Exemple de réponse** :
```json
{
  "success": true,
  "message": "Dates disponibles trouvées",
  "data": {
    "datesDisponibles": [
      {
        "dateDebut": "2024-06-01",
        "dateFin": "2024-06-07",
        "disponibilite": {
          "STANDARD": 10,
          "VIP": 5,
          "SUITE": 3
        }
      },
      {
        "dateDebut": "2024-06-15",
        "dateFin": "2024-06-21",
        "disponibilite": {
          "STANDARD": 8,
          "VIP": 4,
          "SUITE": 2
        }
      }
    ],
    "configuration": {
      "STANDARD": 5,
      "VIP": 2,
      "SUITE": 1,
      "total": 8
    },
    "periodeRecherche": {
      "dateDebut": "2024-06-01",
      "dateFinMax": "2024-12-31",
      "nombreJours": 7
    }
  }
}
```

### 3. Rechercher par nombre total de chambres

```http
POST /api/conventions/rechercher-dates-disponibles-par-nombre-total
```

**Permissions** : MANAGER uniquement

**Corps de la requête** :
```json
{
  "dateDebut": "2024-06-01",
  "dateFin": "2024-12-31",
  "nombreJours": 7,
  "nombreChambresTotal": 8
}
```

**Exemple de réponse** :
```json
{
  "success": true,
  "message": "Dates disponibles trouvées pour 8 chambres",
  "data": {
    "datesDisponibles": [
      {
        "dateDebut": "2024-06-01",
        "dateFin": "2024-06-07",
        "configurationPossible": {
          "STANDARD": 5,
          "VIP": 2,
          "SUITE": 1,
          "total": 8
        },
        "disponibilite": {
          "STANDARD": 10,
          "VIP": 5,
          "SUITE": 3
        }
      }
    ],
    "nombreChambresTotal": 8,
    "nombreJours": 7,
    "periodeRecherche": {
      "dateDebut": "2024-06-01",
      "dateFin": "2024-12-31"
    }
  }
}
```

## Gestion des Fichiers

### 1. Upload du justificatif

```http
POST /api/conventions/{id}/upload-justificatif
```

**Permissions** : MANAGER uniquement

**Content-Type** : `multipart/form-data`

**Corps de la requête** :
- `justificatif` : Fichier (PDF, DOC, DOCX, JPG, PNG, max 5MB)

**Types de fichiers autorisés** :
- PDF (.pdf)
- Word (.doc, .docx)
- Images (.jpg, .jpeg, .png)

### 2. Télécharger le justificatif

```http
GET /api/conventions/{id}/download-justificatif
```

**Permissions** : MANAGER, RECEPTIONIST

## Modèle de Données

### Convention

```json
{
  "id": "UUID",
  "numeroConvention": "STRING (unique)",
  "nomSociete": "STRING",
  "telephone": "STRING",
  "dateDebut": "DATE",
  "dateFin": "DATE",
  "prixConvention": "DECIMAL(10,2)",
  "chambresStandard": "INTEGER (0-50)",
  "chambresVIP": "INTEGER (0-20)",
  "chambresSuite": "INTEGER (0-10)",
  "nombreAdultesMaxParChambre": "INTEGER (1-4)",
  "description": "TEXT (max 2000)",
  "email": "STRING (email)",
  "adresse": "TEXT (max 500)",
  "contactPrincipal": "STRING (max 100)",
  "conditionsSpeciales": "TEXT (max 1000)",
  "notes": "TEXT (max 1000)",
  "statut": "ENUM (ACTIVE, INACTIVE, EXPIRED)",
  "justificatifPath": "STRING",
  "reservationAutomatique": "BOOLEAN",
  "reservationsCreees": "BOOLEAN",
  "createdBy": "UUID",
  "createdAt": "TIMESTAMP",
  "updatedAt": "TIMESTAMP"
}
```

## Codes d'erreur

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Données invalides |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Ressource non trouvée |
| 409 | Conflit (ex: numéro de convention déjà existant) |
| 500 | Erreur serveur |

## Exemples Complets

### Créer une convention complète avec réservations

```bash
# 1. Créer la convention
curl -X POST http://localhost:3000/api/conventions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "numeroConvention": "CONV-2024-001",
    "nomSociete": "Tech Solutions",
    "telephone": "0123456789",
    "dateDebut": "2024-06-01",
    "dateFin": "2024-06-07",
    "prixConvention": 150.00,
    "chambresStandard": 5,
    "chambresVIP": 2,
    "chambresSuite": 1,
    "nombreAdultesMaxParChambre": 2,
    "description": "Convention annuelle Tech Solutions pour la formation des équipes de développement.",
    "email": "contact@techsolutions.com",
    "contactPrincipal": "Jean Dupont"
  }'

# 2. Vérifier la disponibilité
curl -X POST http://localhost:3000/api/conventions/verifier-disponibilite \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateDebut": "2024-06-01",
    "dateFin": "2024-06-07",
    "chambresStandard": 5,
    "chambresVIP": 2,
    "chambresSuite": 1
  }'

# 3. Créer les réservations automatiques
curl -X POST http://localhost:3000/api/conventions/CONVENTION_ID/creer-reservations \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Upload du justificatif
curl -X POST http://localhost:3000/api/conventions/CONVENTION_ID/upload-justificatif \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "justificatif=@/path/to/justificatif.pdf"
```

### Recherche de disponibilité avancée

```bash
# Rechercher toutes les dates disponibles pour 8 chambres
curl -X POST http://localhost:3000/api/conventions/rechercher-dates-disponibles-par-nombre-total \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateDebut": "2024-06-01",
    "dateFin": "2024-12-31",
    "nombreJours": 7,
    "nombreChambresTotal": 8
  }'
```

### Gestion complète d'une convention

```bash
# 1. Lister toutes les conventions
curl -X GET "http://localhost:3000/api/conventions?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Obtenir une convention spécifique
curl -X GET http://localhost:3000/api/conventions/CONVENTION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Modifier une convention
curl -X PUT http://localhost:3000/api/conventions/CONVENTION_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Description mise à jour",
    "notes": "Nouvelles notes importantes"
  }'

# 4. Obtenir le statut des réservations
curl -X GET http://localhost:3000/api/conventions/CONVENTION_ID/statut-reservations \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Annuler les réservations
curl -X DELETE http://localhost:3000/api/conventions/CONVENTION_ID/annuler-reservations \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6. Supprimer la convention
curl -X DELETE http://localhost:3000/api/conventions/CONVENTION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notes importantes

1. **Authentification** : Tous les endpoints nécessitent un token JWT valide
2. **Permissions** : Vérifiez les permissions de votre rôle avant d'appeler les endpoints
3. **Validation** : Tous les champs sont validés côté serveur
4. **Réservations automatiques** : Les réservations ne sont créées que sur demande explicite
5. **Fichiers** : Les justificatifs sont stockés localement avec une limite de 5MB
6. **Pagination** : Utilisez les paramètres `page` et `limit` pour la pagination
7. **Recherche** : La recherche textuelle fonctionne sur plusieurs champs
8. **Statuts** : Les conventions peuvent être ACTIVE, INACTIVE ou EXPIRED

## Support

Pour toute question ou problème, consultez la documentation technique dans le dossier `docs/` ou contactez l'équipe de développement. 