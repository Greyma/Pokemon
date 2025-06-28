
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
  "description": "Convention annuelle de l'entreprise"
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
    "rooms": [
      {
        "id": "room-uuid-1",
        "number": "101",
        "type": "STANDARD"
      }
      // ... autres chambres attribuées automatiquement
    ]
  }
}
```

### Fonctionnalités des conventions

- **Attribution automatique des chambres** : Les chambres sont automatiquement sélectionnées selon les critères de la convention
- **Vérification de disponibilité** : Le système vérifie que les chambres sont disponibles pour la période
- **Gestion des statuts** : ACTIVE, INACTIVE, EXPIRED

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
  "roomId": "room-uuid",
  "numberOfAdults": 2,
  "numberOfChildren": 0,
  "checkInDate": "2025-10-01",
  "checkOutDate": "2025-10-03",
  "conventionId": "convention-uuid" // Optionnel
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "totalPrice": 0, // 0 si conventionné, sinon prix calculé
    "priceDetails": {
      "basePrice": 10000,
      "extraPersonPrice": 0,
      "numberOfNights": 2,
      "isConventionMember": true
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

### Routes disponibles

| Méthode | Route | Description | Rôle requis |
|---------|-------|-------------|-------------|
| POST | `/api/reservations` | Créer une réservation | RECEPTIONIST |
| GET | `/api/reservations` | Lister les réservations | RECEPTIONIST |
| GET | `/api/reservations/:id` | Détails d'une réservation | RECEPTIONIST |
| PUT | `/api/reservations/:id` | Modifier une réservation | RECEPTIONIST |
| POST | `/api/reservations/calculate-price` | Calculer le prix | RECEPTIONIST |
| GET | `/api/reservations/available-rooms` | Chambres disponibles | RECEPTIONIST |
| GET | `/api/reservations/convention/:id/reservations` | Réservations d'une convention | RECEPTIONIST |

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
    "dateDebut": "2025-09-01",
    "nombreJours": 5,
    "chambresStandard": 3,
    "chambresVIP": 1
  }'
```

2. **Récupérer les chambres de la convention**
```bash
curl -X GET http://localhost:3001/api/conventions/$CONVENTION_ID \
  -H "Authorization: Bearer $TOKEN"
```

3. **Créer une réservation conventionnée**
```bash
curl -X POST http://localhost:3001/api/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "RES-CONV-001",
    "nomClient": "John Doe",
    "email": "john@techcorp.com",
    "chambreId": "$ROOM_ID_FROM_CONVENTION",
    "conventionId": "$CONVENTION_ID",
    "montantTotal": 0
  }'
```

### Calcul de prix pour conventionné

```bash
curl -X POST http://localhost:3001/api/reservations/calculate-price \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "$ROOM_ID",
    "numberOfAdults": 2,
    "checkInDate": "2025-09-01",
    "checkOutDate": "2025-09-03",
    "conventionId": "$CONVENTION_ID"
  }'
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
