import sequelize from '../config/database.js';
import Player from './player.js';

const syncModels = async () => {
    try {
      await sequelize.sync({ alter: true }); // Use { force: true } to drop tables
      console.log('All models were synchronized successfully.');
    } catch (error) {
      console.error('Error synchronizing models:', error);
    }
    // Generate 10 players
    const players = [];
    for (let i = 1; i <= 10; i++) {
        players.push({
            player_id: `player ${i}`,
            // Add other properties as needed
        });
    }

    // Insert players into the table
    Player.bulkCreate(players)
        .then(() => {
            console.log('Players inserted successfully.');
        })
        .catch((error) => {
            console.error('Error inserting players:', error);
        });

  };
  
 export {
    sequelize, Player, syncModels
  };
  