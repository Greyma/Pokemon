const User = require('./User');
const Room = require('./Room');
const Reservation = require('./Reservation');
const EmployeeAction = require('./EmployeeAction');
const MaintenanceMode = require('./MaintenanceMode');

// Définir les associations
User.hasMany(Reservation, { foreignKey: 'createdBy', as: 'reservations' });
Reservation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Room.hasMany(Reservation, { foreignKey: 'roomId' });
Reservation.belongsTo(Room, { foreignKey: 'roomId' });

module.exports = {
  User,
  Room,
  Reservation,
  EmployeeAction,
  MaintenanceMode
}; 