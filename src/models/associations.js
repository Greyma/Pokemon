const User = require('./User');
const Room = require('./Room');
const Reservation = require('./Reservation');
const Convention = require('./Convention');
const ConventionRoom = require('./ConventionRoom');

// Définir les associations
User.hasMany(Reservation, { foreignKey: 'createdBy', as: 'userReservations' });
Reservation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Room.hasMany(Reservation, { foreignKey: 'roomId', as: 'roomReservations' });
Reservation.belongsTo(Room, { foreignKey: 'roomId' });

// Association pour les conventions
User.hasMany(Convention, { foreignKey: 'createdBy', as: 'conventions' });
Convention.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Association pour les réservations liées aux conventions
Convention.hasMany(Reservation, { foreignKey: 'conventionId', as: 'conventionReservations' });
Reservation.belongsTo(Convention, { foreignKey: 'conventionId', as: 'convention' });

// Association many-to-many Convention <-> Room
Convention.belongsToMany(Room, { through: ConventionRoom, as: 'rooms', foreignKey: 'conventionId' });
Room.belongsToMany(Convention, { through: ConventionRoom, as: 'conventions', foreignKey: 'roomId' });

module.exports = {
  User,
  Room,
  Reservation,
  Convention,
  ConventionRoom
}; 