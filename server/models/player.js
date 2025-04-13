import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Player = sequelize.define('player', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  player_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  total_wins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_losses: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_ties: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_games: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  // Add virtual fields for win percentage
  getterMethods: {
    win_percentage() {
      return this.total_games > 0 
        ? ((this.total_wins / this.total_games) * 100).toFixed(1) 
        : '0.0';
    }
  }
});

Player.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Add win percentage
  values.win_percentage = this.total_games > 0 
    ? ((this.total_wins / this.total_games) * 100).toFixed(1) 
    : '0.0';
    
  return values;
};

export default Player;
export { Player };