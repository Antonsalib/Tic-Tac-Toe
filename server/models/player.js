import { DataTypes } from 'sequelize';

import sequelize from '../config/database.js';

const Player = sequelize.define('player', {
  player_id: DataTypes.INTEGER,
  total_losses: DataTypes.INTEGER,
  total_wins: DataTypes.INTEGER,
  total_ties: DataTypes.INTEGER,
  total_games: DataTypes.INTEGER,
});

Player.prototype.toJSON = function() {
  const values = { ...this.get() };
  return values;
};

export default Player;
export{ Player };
