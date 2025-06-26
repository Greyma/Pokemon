# API Conventions

## Description
L'API des conventions permet de gérer les conventions d'entreprise avec l'hôtel. Les managers peuvent créer, modifier et supprimer des conventions, tandis que les réceptionnistes peuvent uniquement les consulter.

## Modèle Convention

### Champs obligatoires
- `numeroConvention` (String, unique) : Numéro unique de la convention
- `nomSociete` (String) : Nom de la société
- `telephone` (String) : Numéro de téléphone
- `dateDebut` (Date) : Date de début de la convention
- `dateFin` (Date) : Date de fin de la convention
- `prixConvention` (Decimal) : Prix de la convention
- `nombreChambres` (Integer) : Nombre de chambres à réserver
- `nombreAdultesMaxParChambre` (Integer, 1-4) : Nombre maximum d'adultes par chambre

### Champs optionnels
- `email` (String) : Adresse email de la société
- `adresse` (Text) : Adresse complète de la société
- `contactPrincipal` (String) : Nom du contact principal
- `conditionsSpeciales` (Text) : Conditions spéciales de la convention
- `notes` (Text) : Notes additionnelles
- `justificatifPath` (String) : Chemin vers le fichier justificatif

### Statuts
- `ACTIVE` : Convention active
- `INACTIVE` : Convention inactive
- `EXPIRED` : Convention expirée

## Endpoints

### 1. Récupérer toutes les conventions
**GET** `/api/conventions`

**Permissions** : MANAGER, RECEPTIONIST

**Paramètres de requête** :
- `page` (optionnel) : Numéro de page (défaut: 1)
- `limit` (optionnel) : Nombre d'éléments par page (défaut: 10)
- `search` (optionnel) : Recherche dans numéro, nom société, contact
- `statut` (optionnel) : Filtrer par statut
- `dateDebut` (optionnel) : Date de début pour le filtrage
- `dateFin` (optionnel) : Date de fin pour le filtrage

**Exemple de réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "numeroConvention": "CONV-2024-001",
      "nomSociete": "Entreprise ABC",
      "telephone": "0123456789",
      "dateDebut": "2024-01-01",
      "dateFin": "2024-12-31",
      "prixConvention": "150.00",
      "nombreChambres": 5,
      "nombreAdultesMaxParChambre": 2,
      "statut": "ACTIVE",
      "creator": {
        "id": "uuid",
        "username": "manager1",
        "role": "MANAGER"
      }
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
**GET** `/api/conventions/:id`

**Permissions** : MANAGER, RECEPTIONIST

**Exemple de réponse** :
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "numeroConvention": "CONV-2024-001",
    "nomSociete": "Entreprise ABC",
    "telephone": "0123456789",
    "dateDebut": "2024-01-01",
    "dateFin": "2024-12-31",
    "prixConvention": "150.00",
    "nombreChambres": 5,
    "nombreAdultesMaxParChambre": 2,
    "email": "contact@entreprise-abc.com",
    "adresse": "123 Rue de la Paix, 75001 Paris",
    "contactPrincipal": "Jean Dupont",
    "conditionsSpeciales": "Paiement à 30 jours",
    "statut": "ACTIVE",
    "notes": "Convention renouvelée annuellement",
    "justificatifPath": "convention_uuid_1234567890.pdf",
    "creator": {
      "id": "uuid",
      "username": "manager1",
      "role": "MANAGER"
    }
  }
}
```

### 3. Créer une nouvelle convention
**POST** `/api/conventions`

**Permissions** : MANAGER uniquement

**Corps de la requête** :
```json
{
  "numeroConvention": "CONV-2024-002",
  "nomSociete": "Nouvelle Entreprise",
  "telephone": "0987654321",
  "dateDebut": "2024-02-01",
  "dateFin": "2024-12-31",
  "prixConvention": "120.00",
  "nombreChambres": 3,
  "nombreAdultesMaxParChambre": 2,
  "email": "contact@nouvelle-entreprise.com",
  "adresse": "456 Avenue des Champs, 75008 Paris",
  "contactPrincipal": "Marie Martin",
  "conditionsSpeciales": "Paiement comptant",
  "notes": "Première convention avec cette entreprise"
}
```

### 4. Modifier une convention
**PUT** `/api/conventions/:id`

**Permissions** : MANAGER uniquement

**Corps de la requête** : Même structure que la création

### 5. Supprimer une convention
**DELETE** `/api/conventions/:id`

**Permissions** : MANAGER uniquement

### 6. Upload du justificatif
**POST** `/api/conventions/:id/upload-justificatif`

**Permissions** : MANAGER uniquement

**Type** : `multipart/form-data`

**Champ** : `justificatif` (fichier PDF ou image)

**Types de fichiers acceptés** :
- PDF (`application/pdf`)
- JPEG (`image/jpeg`)
- PNG (`image/png`)
- JPG (`image/jpg`)

**Taille maximale** : 10MB

### 7. Télécharger le justificatif
**GET** `/api/conventions/:id/download-justificatif`

**Permissions** : MANAGER, RECEPTIONIST

**Réponse** : Fichier binaire

## Codes d'erreur

- `400` : Données invalides
- `401` : Non authentifié
- `403` : Accès refusé (rôle insuffisant)
- `404` : Convention non trouvée
- `409` : Conflit (numéro de convention déjà existant)
- `500` : Erreur serveur

## Exemples d'utilisation

### Créer une convention avec cURL
```bash
curl -X POST http://localhost:3001/api/conventions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "numeroConvention": "CONV-2024-003",
    "nomSociete": "Tech Solutions",
    "telephone": "0123456789",
    "dateDebut": "2024-03-01",
    "dateFin": "2024-12-31",
    "prixConvention": "180.00",
    "nombreChambres": 10,
    "nombreAdultesMaxParChambre": 2
  }'
```

### Upload d'un justificatif
```bash
curl -X POST http://localhost:3001/api/conventions/CONVENTION_ID/upload-justificatif \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "justificatif=@/path/to/document.pdf"
```

### Rechercher des conventions
```bash
curl -X GET "http://localhost:3001/api/conventions?search=Tech&statut=ACTIVE&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
``` 