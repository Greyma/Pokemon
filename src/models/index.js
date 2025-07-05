const User = require('./User');
const Room = require('./Room');
const Reservation = require('./Reservation');
const EmployeeAction = require('./EmployeeAction');
const MaintenanceMode = require('./MaintenanceMode');
const Convention = require('./Convention');
const ConventionRoom = require('./ConventionRoom');
const Activity = require('./Activity');
const Supplement = require('./Supplement');

// Importer les associations définies dans associations.js
require('./associations');

module.exports = {
  User,
  Room,
  Reservation,
  EmployeeAction,
  MaintenanceMode,
  Convention,
  ConventionRoom,
  Activity,
  Supplement
}; 