# Résolution de l'Erreur de Contrainte de Clé Étrangère

## Problème

Lors de la création d'une convention, vous pouvez rencontrer cette erreur :

```
SQLITE_CONSTRAINT: FOREIGN KEY constraint failed
```

Cette erreur indique que le champ `createdBy` fait référence à un utilisateur qui n'existe pas dans la base de données.

## Solution Implémentée : Validation depuis le Token JWT

**✅ NOUVEAU :** Le système utilise maintenant la validation directe depuis le token JWT au lieu de faire des requêtes supplémentaires à la base de données.

### Avantages de cette approche :

1. **Performance améliorée** : Pas de requête supplémentaire à la base de données
2. **Sécurité renforcée** : Validation directe des informations du token
3. **Validation complète** : Vérification de l'ID, du rôle, du statut actif
4. **Réduction des erreurs** : Moins de risques de contraintes de clé étrangère

### Informations incluses dans le token JWT :

```javascript
{
  id: "uuid-de-l-utilisateur",
  role: "MANAGER",
  username: "manager1",
  isActive: true
}
```

## Middleware de Validation

### 1. `validateUserFromToken`
Valide l'utilisateur depuis le token JWT :
- Vérifie que l'utilisateur est authentifié
- Vérifie que l'ID utilisateur est présent
- Vérifie que l'utilisateur est actif
- Vérifie que le rôle est valide

### 2. `requireManager`
Vérifie spécifiquement les droits de manager :
- Vérifie que l'utilisateur est un MANAGER
- Vérifie que le compte est actif

## Utilisation dans les Routes

```javascript
// Route protégée avec validation complète
router.post('/conventions', 
  authenticateToken,           // Vérifie le token JWT
  validateUserFromToken,       // Valide l'utilisateur depuis le token
  requireManager,              // Vérifie les droits de manager
  validateCreateConvention,    // Valide les données
  ConventionController.createConvention
);
```

## Causes Possibles (Anciennes)

1. **Utilisateur non authentifié** : Le token JWT ne contient pas un ID d'utilisateur valide
2. **Utilisateur inexistant** : L'utilisateur référencé n'existe pas dans la base de données
3. **Base de données non initialisée** : Aucun utilisateur n'a été créé

## Solutions

### 1. Initialiser la Base de Données

Exécutez le script d'initialisation pour créer les utilisateurs de test :

```bash
node init-db.js
```

Cela va créer :
- Un utilisateur MANAGER : `manager1` / `manager123`
- Un utilisateur RECEPTIONIST : `receptionist1` / `reception123`
- Des chambres de test (STANDARD, VIP, SUITE)
- Des activités de test

### 2. Vérifier l'Authentification

Assurez-vous d'être authentifié avant de créer une convention :

```bash
# 1. Se connecter
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "manager1",
    "password": "manager123"
  }'

# 2. Utiliser le token reçu pour créer une convention
curl -X POST http://localhost:3000/api/conventions \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -H "Content-Type: application/json" \
  -d '{
    "numeroConvention": "CONV-2025-001",
    "nomSociete": "Entreprise Test",
    "telephone": "+213 555 123 456",
    "dateDebut": "2025-06-15",
    "nombreJours": 5,
    "prixConvention": 0,
    "chambresStandard": 3,
    "chambresVIP": 1,
    "chambresSuite": 1,
    "nombreAdultesMaxParChambre": 2
  }'
```

### 3. Utiliser le Script de Test

Le fichier `test.js` inclut maintenant l'authentification automatique et la validation du token :

```bash
# Installer axios si nécessaire
npm install axios

# Exécuter les tests
node test.js
```

Le script va :
1. S'authentifier automatiquement
2. Tester la validation du token
3. Créer une convention de test
4. Tester toutes les fonctionnalités
5. Afficher les résultats

## Vérification

### 1. Vérifier le Token

```bash
# Vérifier le contenu du token
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

Réponse attendue :
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid-de-l-utilisateur",
      "role": "MANAGER",
      "username": "manager1",
      "isActive": true
    }
  }
}
```

### 2. Vérifier la Base de Données

```sql
-- Vérifier les utilisateurs
SELECT id, username, role, isActive FROM Users;

-- Vérifier les conventions
SELECT id, numeroConvention, nomSociete, createdBy FROM Conventions;

-- Vérifier les associations convention-chambres
SELECT c.numeroConvention, r.number, r.type 
FROM Conventions c 
JOIN ConventionRooms cr ON c.id = cr.conventionId 
JOIN Rooms r ON cr.roomId = r.id;
```

### 3. Vérifier les Logs

Les logs du serveur affichent des informations détaillées :

```
🔍 Debug selectAvailableRooms:
Config chambres: { STANDARD: 3, VIP: 1, SUITE: 1 }
Date début: 2025-06-15
Date fin: 2025-06-19
🔍 Toutes les chambres actives: 35
🔍 Chambres par type: { STANDARD: 20, VIP: 10, SUITE: 5 }
🔍 Chambres réservées: 0
🔍 Chambres de conventions: 0
🔍 Chambres disponibles par type: { STANDARD: 20, VIP: 10, SUITE: 5 }
🔍 Chambres sélectionnées: 5
🔍 Chambres manquantes: []
```

## Prévention

### 1. Toujours Initialiser la Base de Données

Avant de commencer à utiliser l'application :

```bash
node init-db.js
```

### 2. Utiliser les Middlewares de Validation

Les routes utilisent maintenant automatiquement les middlewares de validation :

```javascript
// Validation automatique dans toutes les routes
router.post('/conventions', 
  authenticateToken,           // ✅ Vérifie le token
  validateUserFromToken,       // ✅ Valide l'utilisateur
  requireManager,              // ✅ Vérifie les droits
  ConventionController.createConvention
);
```

### 3. Gestion des Erreurs Améliorée

Le système gère maintenant automatiquement :
- Tokens invalides ou expirés
- Utilisateurs désactivés
- Droits insuffisants
- Informations manquantes

## Exemple de Test Complet

```bash
# 1. Initialiser la base de données
node init-db.js

# 2. Démarrer le serveur
npm start

# 3. Dans un autre terminal, exécuter les tests
node test.js
```

Résultat attendu :
```
🚀 Démarrage des tests des conventions avec chambres...

🔐 Authentification...
✅ Authentification réussie
👤 Utilisateur: manager1 (MANAGER)
🆔 ID: uuid-de-l-utilisateur

🧪 Test de validation depuis le token...
📋 Informations du token:
   ID: uuid-de-l-utilisateur
   Username: manager1
   Role: MANAGER
✅ Token vérifié avec succès:
📋 Informations utilisateur du token: { id: 'uuid', role: 'MANAGER', username: 'manager1', isActive: true }
✅ Validation du token invalide fonctionne correctement

🧪 Test de création d'une convention avec chambres...
✅ Convention créée avec succès:
📋 Informations de base: { id: 'uuid', numeroConvention: 'CONV-TEST-001', nomSociete: 'Entreprise Test' }
🏨 Chambres attribuées: 5
  - Chambre 101 (STANDARD)
  - Chambre 102 (STANDARD)
  - Chambre 103 (STANDARD)
  - Chambre 201 (VIP)
  - Chambre 301 (SUITE)

✨ Tests terminés !
```

## Support

Si le problème persiste :

1. Vérifiez les logs du serveur pour plus de détails
2. Assurez-vous que la base de données est correctement initialisée
3. Vérifiez que l'utilisateur existe et est actif
4. Utilisez le script de test pour valider le fonctionnement
5. Vérifiez le contenu du token avec `/api/auth/verify` 