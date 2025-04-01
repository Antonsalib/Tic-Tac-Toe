import sequelize from '../config/database.js';
import Player from './player.js';

const syncModels = async () => {
    try {
      await sequelize.sync({ alter: true }); // Use { force: true } to drop tables
      console.log('All models were synchronized successfully.');
    } catch (error) {
      console.error('Error synchronizing models:', error);
    }
    // Generate 
    // 10 players
    const players = [];
    for (let i = 1; i <= 10; i++) {
    const total_games = Math.floor(Math.random() * 20) + 1; // Random number between 1-12

    // Generate random wins, losses, and ties that sum up to total_games
    let total_wins = Math.floor(Math.random() * (total_games + 1));
    let remaining_games = total_games - total_wins;
    let total_losses = Math.floor(Math.random() * (remaining_games + 1)); 
    let total_ties = total_games - total_wins - total_losses; 
        players.push({
            player_id: `player ${i}`,
            total_wins,
            total_losses,
            total_ties,
            total_games

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
  