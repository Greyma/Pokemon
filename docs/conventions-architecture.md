# Architecture des Conventions - Documentation Technique

## Vue d'ensemble

L'API des conventions a été refactorisée pour suivre une architecture en couches (MVC + Service) avec une séparation claire des responsabilités.

## Structure des fichiers

```
src/
├── models/
│   ├── Convention.js              # Modèle Sequelize
│   └── index.js                   # Associations des modèles
├── controllers/
│   └── conventionController.js    # Contrôleur (logique HTTP)
├── services/
│   └── conventionService.js       # Service (logique métier)
├── middleware/
│   ├── auth.js                    # Authentification et autorisation
│   ├── fileUpload.js              # Gestion des uploads de fichiers
│   └── validation.js              # Validation des données
├── routes/
│   └── conventionRoutes.js        # Définition des routes
└── docs/
    ├── conventions-api.md         # Documentation API
    └── conventions-architecture.md # Cette documentation
```

## Architecture en couches

### 1. Modèle (Model)
**Fichier :** `src/models/Convention.js`

**Responsabilités :**
- Définition de la structure de données
- Validation au niveau base de données
- Relations avec d'autres modèles
- Hooks et méthodes de modèle

**Exemple :**
```javascript
const Convention = sequelize.define('Convention', {
  numeroConvention: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { notEmpty: true }
  },
  // ... autres champs
});
```

### 2. Service (Service Layer)
**Fichier :** `src/services/conventionService.js`

**Responsabilités :**
- Logique métier complexe
- Validation des règles métier
- Gestion des transactions
- Abstraction de la base de données
- Réutilisabilité

**Méthodes principales :**
- `getAllConventions(filters)` - Récupération avec filtres
- `createConvention(data, createdBy)` - Création avec validation
- `updateConvention(id, data)` - Mise à jour avec validation
- `deleteConvention(id)` - Suppression avec nettoyage
- `uploadJustificatif(id, file)` - Gestion des fichiers
- `getConventionStats()` - Statistiques métier

### 3. Contrôleur (Controller)
**Fichier :** `src/controllers/conventionController.js`

**Responsabilités :**
- Gestion des requêtes HTTP
- Validation des entrées
- Gestion des réponses
- Gestion des erreurs HTTP
- Appel des services

**Principe :** Contrôleurs minces, services épais

### 4. Middleware
**Fichiers :**
- `src/middleware/auth.js` - Authentification et autorisation
- `src/middleware/fileUpload.js` - Gestion des uploads
- `src/middleware/validation.js` - Validation des données

**Responsabilités :**
- Validation des données d'entrée
- Vérification des permissions
- Gestion des fichiers uploadés
- Transformation des données

### 5. Routes
**Fichier :** `src/routes/conventionRoutes.js`

**Responsabilités :**
- Définition des endpoints
- Chaînage des middlewares
- Mapping vers les contrôleurs

## Flux de données

```
Client Request
    ↓
Routes (conventionRoutes.js)
    ↓
Middleware (auth, validation, fileUpload)
    ↓
Controller (conventionController.js)
    ↓
Service (conventionService.js)
    ↓
Model (Convention.js)
    ↓
Database
```

## Avantages de cette architecture

### 1. Séparation des responsabilités
- **Routes** : Définition des endpoints
- **Middleware** : Validation et authentification
- **Contrôleurs** : Gestion HTTP
- **Services** : Logique métier
- **Modèles** : Accès aux données

### 2. Réutilisabilité
- Les services peuvent être utilisés par différents contrôleurs
- La logique métier est centralisée
- Les middlewares sont réutilisables

### 3. Testabilité
- Chaque couche peut être testée indépendamment
- Les services peuvent être mockés facilement
- Tests unitaires et d'intégration séparés

### 4. Maintenabilité
- Code organisé et structuré
- Responsabilités claires
- Facilité de modification

### 5. Évolutivité
- Ajout facile de nouvelles fonctionnalités
- Modification sans impact sur les autres couches
- Extension simple des validations

## Gestion des erreurs

### Niveaux d'erreur
1. **Validation** (400) - Données invalides
2. **Authentification** (401) - Non authentifié
3. **Autorisation** (403) - Permissions insuffisantes
4. **Not Found** (404) - Ressource non trouvée
5. **Conflit** (409) - Données en conflit
6. **Serveur** (500) - Erreur interne

### Gestion centralisée
- Erreurs métier dans les services
- Erreurs HTTP dans les contrôleurs
- Validation dans les middlewares

## Validation des données

### Niveaux de validation
1. **Middleware** - Validation des entrées HTTP
2. **Service** - Validation des règles métier
3. **Modèle** - Validation au niveau base de données

### Types de validation
- **Format** : Email, téléphone, dates
- **Longueur** : Min/max caractères
- **Valeurs** : Énumérations, plages
- **Relations** : Existence, unicité

## Gestion des fichiers

### Upload
- Validation des types de fichiers
- Limitation de taille
- Génération de noms uniques
- Nettoyage automatique

### Stockage
- Dossier organisé par type
- Noms de fichiers sécurisés
- Gestion des anciens fichiers

## Sécurité

### Authentification
- JWT tokens
- Vérification des tokens
- Gestion des sessions

### Autorisation
- Rôles utilisateur (MANAGER, RECEPTIONIST)
- Permissions granulaires
- Vérification des droits

### Validation
- Sanitisation des entrées
- Validation des types
- Protection contre les injections

## Performance

### Optimisations
- Pagination des résultats
- Index de base de données
- Requêtes optimisées
- Cache des validations

### Monitoring
- Logs d'erreurs
- Métriques de performance
- Traçabilité des requêtes

## Tests

### Types de tests
1. **Unitaires** - Services et utilitaires
2. **Intégration** - API endpoints
3. **E2E** - Flux complets

### Outils recommandés
- Jest pour les tests unitaires
- Supertest pour les tests d'API
- Mock des services

## Déploiement

### Configuration
- Variables d'environnement
- Configuration par environnement
- Gestion des secrets

### Monitoring
- Logs structurés
- Métriques de santé
- Alertes automatiques

## Évolutions futures

### Fonctionnalités possibles
- Cache Redis pour les performances
- Webhooks pour les notifications
- API GraphQL
- Documentation automatique (Swagger)

### Améliorations techniques
- Migration vers TypeScript
- Microservices
- Event sourcing
- CQRS pattern 