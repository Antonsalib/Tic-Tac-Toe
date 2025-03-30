import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Move = sequelize.define(
  'Move',
  {
    move_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Game',
        key: 'game_id'
      }
    },
    player_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Player',
        key: 'player_id'
      }
    },
    move_order: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    }
  },
  {
    timestamps: false
  }
);

Move.prototype.toJSON = function () {
  const values = { ...this.get() };
  return values;
};

export default Move;
export { Move };
