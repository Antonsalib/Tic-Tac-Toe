// models/int.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Move = sequelize.define('Move', {
  move_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  game_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  player: {
    type: DataTypes.STRING,
    allowNull: false
  },
  row: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 2
    }
  },
  col: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 2
    }
  },
  board_position: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [
        [
          'top_left',
          'top_center',
          'top_right',
          'middle_left',
          'middle_center',
          'middle_right',
          'bottom_left',
          'bottom_center',
          'bottom_right'
        ]
      ]
    }
  },
  game_status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

Move.prototype.toJSON = function () {
  const values = { ...this.get() };
  return values;
};

export default Move;
export { Move };