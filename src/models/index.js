const User = require('./User');
const Room = require('./Room');
const Reservation = require('./Reservation');
const EmployeeAction = require('./EmployeeAction');
const MaintenanceMode = require('./MaintenanceMode');
const Convention = require('./Convention');

// Définir les associations
User.hasMany(Reservation, { foreignKey: 'createdBy', as: 'reservations' });
Reservation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Room.hasMany(Reservation, { foreignKey: 'roomId' });
Reservation.belongsTo(Room, { foreignKey: 'roomId' });

// Association pour les conventions
User.hasMany(Convention, { foreignKey: 'createdBy', as: 'conventions' });
Convention.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = {
  User,
  Room,
  Reservation,
  EmployeeAction,
  MaintenanceMode,
  Convention
}; 